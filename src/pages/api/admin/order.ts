// src/pages/api/admin/order.ts
//
// Staff-only endpoint behind the /admin/orders/ page. Protected by a shared
// secret (ADMIN_TOKEN) sent as the `x-admin-token` header — not full user
// accounts/roles, but enough to keep this off the public internet.
// See SETUP_NEW_FEATURES.md → "2. Track Your Move" for how to set the token.
export const prerender = false;

export const STAGES = [
  'Booking Received',
  'Survey Scheduled',
  'Packing Crew Assigned',
  'In Transit',
  'Delivered',
  'Cancelled',
] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function checkAuth(request: Request, locals: App.Locals): boolean {
  const expected = locals?.runtime?.env?.ADMIN_TOKEN ?? import.meta.env.ADMIN_TOKEN;
  if (!expected) return false; // refuse by default if no token has been configured
  const provided = request.headers.get('x-admin-token');
  return !!provided && provided === expected;
}

// GET /api/admin/order?id=PH-XXXXXX — full record lookup for staff (no phone check needed, token already authenticates)
export async function GET({ request, url, locals }: { request: Request; url: URL; locals: App.Locals }) {
  if (!checkAuth(request, locals)) return json({ ok: false, error: 'Unauthorized' }, 401);

  const id = url.searchParams.get('id')?.trim().toUpperCase();
  if (!id) return json({ ok: false, error: 'id is required' }, 400);

  const kv = locals?.runtime?.env?.TRACKING_KV;
  if (!kv) return json({ ok: false, error: 'TRACKING_KV is not bound on this environment' }, 500);

  const raw = await kv.get(id);
  if (!raw) return json({ ok: false, error: 'Not found' }, 404);

  return json({ ok: true, record: JSON.parse(raw), stages: STAGES });
}

// POST /api/admin/order — body: { id, status, note? } — advance/update a booking's status
export async function POST({ request, locals }: { request: Request; locals: App.Locals }) {
  if (!checkAuth(request, locals)) return json({ ok: false, error: 'Unauthorized' }, 401);

  const kv = locals?.runtime?.env?.TRACKING_KV;
  if (!kv) return json({ ok: false, error: 'TRACKING_KV is not bound on this environment' }, 500);

  try {
    const { id, status, note } = (await request.json()) as { id?: string; status?: string; note?: string };
    const cleanId = (id || '').trim().toUpperCase();

    if (!cleanId) return json({ ok: false, error: 'id is required' }, 400);
    if (!status || !STAGES.includes(status as typeof STAGES[number])) {
      return json({ ok: false, error: `status must be one of: ${STAGES.join(', ')}` }, 400);
    }

    const raw = await kv.get(cleanId);
    if (!raw) return json({ ok: false, error: 'Not found' }, 404);

    const record = JSON.parse(raw);
    const now = new Date().toISOString();
    record.status = status;
    record.updatedAt = now;
    record.timeline = record.timeline || [];
    record.timeline.push({ status, at: now, note: (note || '').trim() });

    await kv.put(cleanId, JSON.stringify(record));
    return json({ ok: true, record });
  } catch {
    return json({ ok: false, error: 'Invalid request body' }, 400);
  }
}
