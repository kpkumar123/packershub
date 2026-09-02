// src/pages/api/admin/seo-ops.ts
//
// Staff-only endpoint behind /admin/seo-ops/. Same shared-secret pattern as
// /api/admin/order.ts (ADMIN_TOKEN via x-admin-token header). Reuses the
// existing TRACKING_KV namespace — no new binding needed — under two key
// prefixes:
//   competitor:<id>   — Module 55 (competitor gap matrix entries)
//   citation:<id>     — Module 59.4 (AI-answer citation log)
//
// This tool only stores what staff type in manually (a competitor's public
// listing, or a screenshot-verified AI answer that mentioned/omitted
// PackersHub). It never generates or estimates data on its own — same
// no-fabrication rule as reviews.json.
//
// v10.7.14 — added two more prefixes, same manual-entry rule:
//   rank:<id>     — Module 44 (rank tracking). Staff pastes a real position
//                    they saw in Search Console/Semrush for a keyword+city.
//   traffic:<id>  — Module 46/48 (traffic-drop detective + forecast input).
//                    Staff pastes a real monthly clicks/sessions number from
//                    GSC/GA4. The forecast endpoint below runs a plain linear
//                    trend over whatever real numbers exist — it does not
//                    invent data points, and returns null until there are
//                    at least 3 logged months.

import { env } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function checkAuth(request: Request): boolean {
  const expected = env?.ADMIN_TOKEN ?? import.meta.env.ADMIN_TOKEN;
  if (!expected) return false;
  const provided = request.headers.get('x-admin-token');
  return !!provided && provided === expected;
}

function getKV() {
  return env?.TRACKING_KV;
}

// GET /api/admin/seo-ops?type=competitor|citation — list entries
export async function GET({ request, url }: { request: Request; url: URL }) {
  if (!checkAuth(request)) return json({ ok: false, error: 'Unauthorized' }, 401);
  const kv = getKV();
  if (!kv) return json({ ok: false, error: 'TRACKING_KV not configured yet' }, 503);

  const typeParam = url.searchParams.get('type');
  const validTypes = ['competitor', 'citation', 'rank', 'traffic'];
  const type = validTypes.includes(typeParam || '') ? typeParam! : 'competitor';
  const list = await kv.list({ prefix: `${type}:` });
  const entries = await Promise.all(
    list.keys.map(async (k) => {
      const raw = await kv.get(k.name);
      return raw ? JSON.parse(raw) : null;
    })
  );
  const sorted = entries.filter(Boolean).sort((a, b) => (b.loggedAt || '').localeCompare(a.loggedAt || ''));

  // Module 48 (forecast): only for type=traffic, only a plain linear trend
  // over the real logged monthly numbers — no synthetic data points, and
  // no forecast at all until 3+ real months exist.
  let forecast = null;
  if (type === 'traffic') {
    const withMonth = sorted.filter((e) => e.month && typeof e.clicks === 'number').sort((a, b) => a.month.localeCompare(b.month));
    if (withMonth.length >= 3) {
      const n = withMonth.length;
      const xs = withMonth.map((_, i) => i);
      const ys = withMonth.map((e) => e.clicks);
      const xMean = xs.reduce((a, b) => a + b, 0) / n;
      const yMean = ys.reduce((a, b) => a + b, 0) / n;
      const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
      const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
      const slope = den === 0 ? 0 : num / den;
      const intercept = yMean - slope * xMean;
      const nextMonthEstimate = Math.max(0, Math.round(intercept + slope * n));
      forecast = {
        basedOnMonths: n,
        trendPerMonth: Math.round(slope),
        nextMonthEstimate,
        note: 'Linear trend over real logged months only — not a prediction model, just arithmetic on your actual numbers.',
      };
    }
  }

  return json({ ok: true, entries: sorted, ...(forecast ? { forecast } : {}) });
}

// POST /api/admin/seo-ops  { type: 'competitor'|'citation', ...fields }
export async function POST({ request }: { request: Request }) {
  if (!checkAuth(request)) return json({ ok: false, error: 'Unauthorized' }, 401);
  const kv = getKV();
  if (!kv) return json({ ok: false, error: 'TRACKING_KV not configured yet' }, 503);

  const body = await request.json().catch(() => null);
  const validTypes = ['competitor', 'citation', 'rank', 'traffic'];
  if (!body || !validTypes.includes(body.type)) {
    return json({ ok: false, error: 'type must be one of: competitor, citation, rank, traffic' }, 400);
  }

  const id = crypto.randomUUID().slice(0, 8);
  const record = { id, loggedAt: new Date().toISOString(), ...body };
  await kv.put(`${body.type}:${id}`, JSON.stringify(record));
  return json({ ok: true, record });
}

// DELETE /api/admin/seo-ops?type=competitor&id=xxxx
export async function DELETE({ request, url }: { request: Request; url: URL }) {
  if (!checkAuth(request)) return json({ ok: false, error: 'Unauthorized' }, 401);
  const kv = getKV();
  if (!kv) return json({ ok: false, error: 'TRACKING_KV not configured yet' }, 503);

  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');
  if (!type || !id) return json({ ok: false, error: 'type and id required' }, 400);
  await kv.delete(`${type}:${id}`);
  return json({ ok: true });
}
