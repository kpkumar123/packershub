// src/pages/api/follow-up-cron.ts
//
// Cloudflare Cron Trigger — fires every 5 minutes.
// Scans KV for leads whose timed follow-up steps are due,
// then calls /api/follow-up for each pending step.
//
// wrangler.toml entry:
//   [[triggers.crons]]
//   crons = ["*/5 * * * *"]
//   [triggers.crons.bindings]
//   # No extra binding needed — uses same TRACKING_KV + env vars
//
// Cloudflare Pages does NOT support cron triggers directly.
// Two options:
//   A) Migrate this logic to a Cloudflare Worker (separate worker.js)
//      that shares the same KV namespace — RECOMMENDED.
//   B) Use Cloudflare Queues: /api/lead enqueues delayed jobs,
//      a Consumer Worker processes them at the right time.
//   C) Use an external cron service (cron-job.org, Render cron)
//      to call a secret-protected endpoint every 5 minutes.
//
// This file documents the logic for Option A/C.
// To use Option C, deploy this as a standard Astro API route and
// protect it with a shared secret in CRON_SECRET env var.

import { env } from 'cloudflare:workers';

export const prerender = false;

const SEQUENCE_DELAYS_MS: Record<string, number> = {
  h4:  4  * 60 * 60 * 1000,
  h24: 24 * 60 * 60 * 1000,
  h72: 72 * 60 * 60 * 1000,
};

// v10.6.3 — how long after a booking is marked "Delivered" to ask for a
// review. 4 hours: long enough that the customer has unpacked and formed
// an impression, short enough that the move is still fresh in memory.
const REVIEW_DELAY_MS = 4 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET({ request }: { request: Request }) {
  // Secret-protect the cron endpoint
  const secret = env?.CRON_SECRET ?? import.meta.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token') ?? request.headers.get('x-cron-token');
    if (token !== secret) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }
  }

  const kv = env?.TRACKING_KV;
  if (!kv) {
    return json({ ok: false, error: 'KV not configured' });
  }

  const now = Date.now();
  let processed = 0;
  let skipped = 0;

  try {
    // List all follow-up state keys
    const { keys } = await kv.list({ prefix: 'followup:' });

    for (const key of keys) {
      try {
        const raw = await kv.get(key.name);
        if (!raw) continue;
        const state = JSON.parse(raw);

        if (state.responded) { skipped++; continue; }

        const createdAt = new Date(state.createdAt).getTime();

        for (const [step, delayMs] of Object.entries(SEQUENCE_DELAYS_MS)) {
          if (state.steps?.[step]) continue; // already sent
          if (now - createdAt < delayMs) continue; // not time yet

          // Get the lead record to build the follow-up payload
          const trackingId = key.name.replace('followup:', '');
          const leadRaw = await kv.get(trackingId);
          if (!leadRaw) continue;
          const lead = JSON.parse(leadRaw);

          // Call the follow-up API
          const baseUrl = env?.SITE_URL ?? 'https://packershub.in';
          const res = await fetch(`${baseUrl}/api/follow-up`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackingId,
              name: lead.name,
              phone: lead.phone,
              email: lead.email || undefined,
              fromCity: lead.fromCity || undefined,
              toCity: lead.toCity || undefined,
              moveDate: lead.moveDate || undefined,
              moveType: lead.moveType || undefined,
              estimate: lead.estimate ?? undefined,
              sequenceStep: step,
            }),
          });

          if (res.ok) processed++;
        }
      } catch { /* individual lead errors are non-fatal */ }
    }

    // ── Review-request scan (separate clock — see scanReviewRequests below) ──
    const baseUrl = env?.SITE_URL ?? 'https://packershub.in';
    const reviewResult = await scanReviewRequests(kv, baseUrl).catch((err) => {
      console.error('[follow-up-cron] review scan failed:', err);
      return { processed: 0, skipped: 0, checked: 0 };
    });

    return json({
      ok: true,
      processed, skipped, checked: keys.length,
      review: reviewResult,
    });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

// ── REVIEW REQUEST SCAN ────────────────────────────────────────
// Separate from the booking-creation sequence above because it's keyed off
// deliveredAt (set by staff in /api/admin/order.ts), not the lead's
// createdAt — a booking can sit for weeks between "lead captured" and
// "delivered", so these two clocks have to be independent.
async function scanReviewRequests(kv: KVNamespace, baseUrl: string) {
  const now = Date.now();
  let processed = 0;
  let skipped = 0;

  const { keys } = await kv.list({ prefix: 'review:' });

  for (const key of keys) {
    try {
      const raw = await kv.get(key.name);
      if (!raw) continue;
      const state = JSON.parse(raw);

      if (state.requested) { skipped++; continue; }

      const deliveredAt = new Date(state.deliveredAt).getTime();
      if (Number.isNaN(deliveredAt) || now - deliveredAt < REVIEW_DELAY_MS) continue;

      const trackingId = key.name.replace('review:', '');
      const leadRaw = await kv.get(trackingId);
      if (!leadRaw) continue;
      const lead = JSON.parse(leadRaw);

      const res = await fetch(`${baseUrl}/api/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingId,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || undefined,
          fromCity: lead.fromCity || undefined,
          toCity: lead.toCity || undefined,
          sequenceStep: 'review',
        }),
      });

      if (res.ok) {
        processed++;
        // Mark requested regardless of whether email/SMS actually fired —
        // /api/follow-up already no-ops gracefully if email/GOOGLE_REVIEW_URL
        // aren't configured, and we don't want to retry every 5 minutes
        // forever for a booking with no email on file.
        await kv.put(key.name, JSON.stringify({ ...state, requested: true, requestedAt: new Date().toISOString() }));
      }
    } catch { /* individual booking errors are non-fatal */ }
  }

  return { processed, skipped, checked: keys.length };
}

// Also handle POST for Cloudflare Cron Worker trigger pattern
export async function POST(ctx: { request: Request }) {
  return GET(ctx);
}
