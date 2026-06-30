// src/pages/api/track.ts
//
// Public lookup for the /track/ page. Requires BOTH the Tracking ID and the
// last 4 digits of the phone number used at booking — this is a deliberate
// privacy check so a leaked/guessed Tracking ID alone can't reveal a
// customer's move details.
//
// Honesty note: this is a milestone tracker (status updated by the
// PackersHub team at each stage), not live GPS. If you want literal live
// GPS tracking later, that's a separate, bigger feature — this gives
// customers real visibility today without claiming something we don't have.
import { env } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET({ url }: { url: URL }) {
  try {
    const id = url.searchParams.get('id')?.trim().toUpperCase();
    const phone = url.searchParams.get('phone')?.trim();

    if (!id) return json({ ok: false, error: 'Please enter your Tracking ID.' });
    if (!phone) return json({ ok: false, error: 'Please enter the phone number used at booking.' });

    // Cloudflare adapter v13: env bindings come from cloudflare:workers,
    // not Astro.locals.runtime.env (removed).
    const kv = env?.TRACKING_KV;
    if (!kv) {
      return json({
        ok: false,
        error: 'Online tracking isn\u2019t set up yet on this deployment. Please call +91 77310 74075 with your Tracking ID.',
      });
    }

    const raw = await kv.get(id);
    if (!raw) {
      return json({ ok: false, error: 'No booking found with that Tracking ID. Please check and try again.' });
    }

    const record = JSON.parse(raw);
    const last4Stored = (record.phone || '').replace(/\D/g, '').slice(-4);
    const last4Input = phone.replace(/\D/g, '').slice(-4);

    if (!last4Stored || last4Stored !== last4Input) {
      return json({ ok: false, error: 'That phone number doesn\u2019t match our records for this Tracking ID.' });
    }

    return json({
      ok: true,
      trackingId: record.trackingId,
      status: record.status,
      timeline: record.timeline,
      fromCity: record.fromCity,
      toCity: record.toCity,
      moveDate: record.moveDate,
      moveType: record.moveType,
      createdAt: record.createdAt,
      paymentStatus: record.paymentStatus,
      paymentType: record.paymentType, // 'advance' | 'full' — v10.6.3
    });
  } catch {
    return json({ ok: false, error: 'Something went wrong. Please call +91 77310 74075.' });
  }
}
