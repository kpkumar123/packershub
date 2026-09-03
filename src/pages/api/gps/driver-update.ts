// src/pages/api/gps/driver-update.ts — PackersHub v10.6.3
//
// Lets the actual driver push a GPS point from their own phone via a plain
// link (/driver/PH-XXXXXX?t=<token>) — no app, no login, no curl. This is
// distinct from /api/gps/update, which requires the master GPS_ADMIN_TOKEN
// and is meant for staff/admin use.
//
// Why a separate endpoint instead of just sharing GPS_ADMIN_TOKEN with the
// driver: that token can push GPS for *any* booking. A driver only needs to
// update *their own* booking, so this endpoint accepts a scoped, per-booking
// token instead:
//
//   driverToken = hex(HMAC-SHA256(trackingId, GPS_ADMIN_TOKEN))
//
// The admin dashboard (src/pages/admin/orders.astro) computes this token
// client-side — using the GPS_ADMIN_TOKEN the staff member already has —
// and builds the /driver/<id>?t=<token> link to send the driver over
// WhatsApp. This endpoint recomputes the same HMAC server-side with the
// real secret and compares. A leaked driver link only ever allows pushing
// GPS for that one booking — never any other, and never staff actions like
// changing status.
//
// No new Cloudflare secrets needed — reuses GPS_ADMIN_TOKEN.

import { env } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface DriverGpsPayload {
  trackingId:  string;
  driverToken: string;
  lat:         number;
  lng:         number;
  note?:       string;
  vehicleNo?:  string;
}

// Same HMAC scheme as the client-side token generator in admin/orders.astro —
// must produce byte-identical hex output for the comparison to ever match.
async function computeDriverToken(secret: string, trackingId: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(trackingId));
  return [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time-ish string compare (best-effort in a Workers runtime —
// good enough for this scoped, single-purpose token, not a substitute for
// a real crypto-grade comparison on a high-value secret).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as DriverGpsPayload;
    const { trackingId, driverToken, lat, lng, note, vehicleNo } = body;

    if (!trackingId || !/^PH-[A-Z2-9]{6}$/.test(trackingId)) {
      return json({ ok: false, error: 'Invalid tracking ID.' }, 400);
    }
    if (!driverToken) {
      return json({ ok: false, error: 'Missing driver link token.' }, 401);
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return json({ ok: false, error: 'Location not available. Please allow location access.' }, 400);
    }
    if (lat < 7 || lat > 37 || lng < 68 || lng > 98) {
      return json({ ok: false, error: 'Coordinates appear outside India.' }, 400);
    }

    const adminToken = (env as any)?.GPS_ADMIN_TOKEN ?? import.meta.env.GPS_ADMIN_TOKEN;
    if (!adminToken) {
      return json({ ok: false, error: 'GPS tracking is not configured on this deployment.' }, 503);
    }

    const expected = await computeDriverToken(adminToken, trackingId);
    if (!safeEqual(expected, driverToken)) {
      return json({ ok: false, error: 'This driver link is invalid or has expired.' }, 401);
    }

    const kv = (env as any)?.TRACKING_KV;
    if (!kv) return json({ ok: false, error: 'KV not configured.' }, 503);

    const raw = await kv.get(trackingId);
    if (!raw) return json({ ok: false, error: 'Booking not found.' }, 404);

    const record = JSON.parse(raw);
    const now: string = new Date().toISOString();

    const newEntry = {
      lat, lng, at: now,
      ...(note      ? { note }      : {}),
      ...(vehicleNo ? { vehicleNo } : {}),
      source: 'driver', // distinguishes self-reported points from staff-pushed ones in KV history
    };

    const history: any[] = Array.isArray(record.gpsHistory) ? record.gpsHistory : [];
    history.push(newEntry);
    if (history.length > 50) history.splice(0, history.length - 50);

    record.gpsLatest  = newEntry;
    record.gpsHistory = history;
    record.updatedAt  = now;

    // Same auto-advance behavior as the staff GPS endpoint.
    if (record.status === 'Packing Crew Assigned') {
      record.status = 'In Transit';
      if (!Array.isArray(record.timeline)) record.timeline = [];
      record.timeline.push({
        status: 'In Transit',
        at:     now,
        note:   'GPS tracking active — your goods are on the way.',
      });
    }

    await kv.put(trackingId, JSON.stringify(record));

    return json({ ok: true, trackingId, at: now, pointsKept: history.length });
  } catch (e) {
    console.error('[gps/driver-update]', e);
    return json({ ok: false, error: 'Server error. Please try again.' }, 500);
  }
}
