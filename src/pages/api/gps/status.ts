// src/pages/api/gps/status.ts
//
// Public GPS fetch for the /track/ page.
// Returns the latest GPS point + history trail for a given tracking ID,
// after verifying the same phone-last-4 privacy check used by /api/track.
//
// Returns gpsLatest (single point) and gpsHistory (array of up to 50 points)
// so the front-end can draw both a current-position marker and a route line.
//
// If no GPS data has been pushed yet (move not yet In Transit), returns
// ok:true but gpsLatest:null — the map component handles this gracefully
// by showing the source and destination markers only.
//
// Astro 7.0.3 / Cloudflare adapter v13

import { env } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',   // Never cache GPS — always fresh
    },
  });
}

export async function GET({ url }: { url: URL }) {
  try {
    const id    = url.searchParams.get('id')?.trim().toUpperCase();
    const phone = url.searchParams.get('phone')?.trim();

    if (!id)    return json({ ok: false, error: 'Missing tracking ID.' });
    if (!phone) return json({ ok: false, error: 'Missing phone number.' });

    const kv = (env as any)?.TRACKING_KV;
    if (!kv) return json({ ok: false, error: 'Tracking not configured.' });

    const raw = await kv.get(id);
    if (!raw) return json({ ok: false, error: 'Booking not found.' });

    const record = JSON.parse(raw);

    // Same privacy check as /api/track
    const last4Stored = (record.phone || '').replace(/\D/g, '').slice(-4);
    const last4Input  = phone.replace(/\D/g, '').slice(-4);
    if (!last4Stored || last4Stored !== last4Input) {
      return json({ ok: false, error: 'Phone number does not match.' });
    }

    return json({
      ok:         true,
      trackingId: record.trackingId,
      status:     record.status,
      fromCity:   record.fromCity,
      toCity:     record.toCity,
      gpsLatest:  record.gpsLatest  ?? null,
      gpsHistory: record.gpsHistory ?? [],
      updatedAt:  record.updatedAt,
    });

  } catch (e) {
    console.error('[gps/status]', e);
    return json({ ok: false, error: 'Server error.' });
  }
}
