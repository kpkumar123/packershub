// src/pages/api/gps/update.ts
//
// Admin endpoint — PackersHub team pushes truck GPS coordinates for
// a booking that is "In Transit". The /track/ page reads these via
// /api/gps/status and renders a live map using OpenStreetMap (no billing,
// no API key required for rendering — only this update endpoint exists
// server-side).
//
// Auth: Bearer token (GPS_ADMIN_TOKEN secret). Simple but sufficient for
// internal team use from a mobile app / WhatsApp bot webhook.
//
// Usage (team member sends from phone):
//   POST https://packershub.in/api/gps/update
//   Authorization: Bearer <GPS_ADMIN_TOKEN>
//   { "trackingId":"PH-XXXXXX","lat":17.38,"lng":78.48,"note":"Near Kurnool" }
//
// WhatsApp bot integration (optional):
//   Use Twilio / Zoko / WATI to forward driver's live location share
//   (WhatsApp sends lat/lng for shared live locations) → this endpoint.
//
// Required Cloudflare secrets:
//   GPS_ADMIN_TOKEN — any strong random string you set (≥32 chars)
//   TRACKING_KV     — already bound
//
// Astro 7.0.3 / Cloudflare adapter v13

import { env } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface GpsPayload {
  trackingId: string;
  lat:        number;
  lng:        number;
  note?:      string;      // e.g. "Near Kurnool toll" — shown on map popup
  speed?:     number;      // km/h — optional, if driver app provides it
  eta?:       string;      // free text ETA — e.g. "Tomorrow by 2 PM"
  vehicleNo?: string;      // e.g. "AP 15 AB 1234"
}

// GPS history entry stored in KV
interface GpsEntry {
  lat:       number;
  lng:       number;
  note?:     string;
  speed?:    number;
  eta?:      string;
  vehicleNo?: string;
  at:        string;       // ISO timestamp
}

export async function POST({ request }: { request: Request }) {
  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const adminToken = (env as any)?.GPS_ADMIN_TOKEN ?? import.meta.env.GPS_ADMIN_TOKEN;
    const authHeader = request.headers.get('Authorization') || '';
    const token      = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!adminToken || token !== adminToken) {
      return json({ ok: false, error: 'Unauthorized.' }, 401);
    }

    const body = (await request.json()) as GpsPayload;
    const { trackingId, lat, lng, note, speed, eta, vehicleNo } = body;

    // ── Validate ─────────────────────────────────────────────────────────────
    if (!trackingId || !/^PH-[A-Z2-9]{6}$/.test(trackingId)) {
      return json({ ok: false, error: 'Invalid tracking ID.' }, 400);
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return json({ ok: false, error: 'lat and lng must be numbers.' }, 400);
    }
    if (lat < 7 || lat > 37 || lng < 68 || lng > 98) {
      // Rough India bounding box sanity check
      return json({ ok: false, error: 'Coordinates appear outside India.' }, 400);
    }

    const kv = (env as any)?.TRACKING_KV;
    if (!kv) return json({ ok: false, error: 'KV not configured.' }, 503);

    const now: string = new Date().toISOString();

    // ── Read booking record ───────────────────────────────────────────────────
    const raw = await kv.get(trackingId);
    if (!raw) return json({ ok: false, error: 'Booking not found.' }, 404);

    const record = JSON.parse(raw);

    // ── Build new GPS entry ───────────────────────────────────────────────────
    const newEntry: GpsEntry = {
      lat, lng, at: now,
      ...(note      ? { note }      : {}),
      ...(speed     ? { speed }     : {}),
      ...(eta       ? { eta }       : {}),
      ...(vehicleNo ? { vehicleNo } : {}),
    };

    // Keep last 50 GPS points (breadcrumb trail for route line on map)
    const history: GpsEntry[] = Array.isArray(record.gpsHistory)
      ? record.gpsHistory
      : [];
    history.push(newEntry);
    if (history.length > 50) history.splice(0, history.length - 50);

    // ── Update record ─────────────────────────────────────────────────────────
    record.gpsLatest  = newEntry;
    record.gpsHistory = history;
    record.updatedAt  = now;

    // Auto-advance status to "In Transit" if currently at "Packing Crew Assigned"
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

    return json({
      ok:         true,
      trackingId,
      lat, lng,
      at:         now,
      pointsKept: history.length,
    });

  } catch (e) {
    console.error('[gps/update]', e);
    return json({ ok: false, error: 'Server error.' }, 500);
  }
}
