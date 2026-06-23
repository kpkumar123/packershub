// src/pages/api/lead.ts
//
// Backup lead capture. Every form on the site (Contact, Booking Engine,
// Franchise enquiry) calls this BEFORE opening WhatsApp — so a lead is
// saved even if the customer never sends the WhatsApp message, closes the
// tab, or doesn't have WhatsApp installed.
//
// This endpoint never throws and never blocks the WhatsApp flow:
// - If Cloudflare KV (TRACKING_KV) is bound, the lead is stored there and
//   gets a Tracking ID the customer can use on /track/.
// - If Resend (RESEND_API_KEY + LEAD_NOTIFY_EMAIL) is configured, an email
//   notification is sent to your team as a second, independent backup.
// - If NEITHER is configured yet, this still returns ok:true so the
//   WhatsApp flow is completely unaffected — see SETUP_NEW_FEATURES.md to
//   turn the backups on.
export const prerender = false;

function generateTrackingId(): string {
  // Avoids ambiguous characters (0/O, 1/I) for easier phone read-back.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'PH-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

const TRACKING_ID_RE = /^PH-[A-Z2-9]{6}$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface LeadPayload {
  type?: 'contact' | 'booking' | 'franchise' | string;
  trackingId?: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  fromCity?: string;
  toCity?: string;
  moveDate?: string;
  moveType?: string;
  estimate?: number;
  source?: string;
}

export async function POST({ request, locals }: { request: Request; locals: App.Locals }) {
  try {
    const body = (await request.json()) as LeadPayload;
    const phone = (body.phone || '').toString().trim();

    if (!phone || phone.replace(/\D/g, '').length < 7) {
      return json({ ok: false, error: 'A valid phone number is required.' }, 400);
    }

    const clientId = (body.trackingId || '').toString().trim().toUpperCase();
    const trackingId = TRACKING_ID_RE.test(clientId) ? clientId : generateTrackingId();
    const now = new Date().toISOString();

    const record = {
      trackingId,
      type: body.type || 'general',
      name: (body.name || '').toString().trim(),
      phone,
      email: (body.email || '').toString().trim(),
      message: (body.message || '').toString().trim(),
      fromCity: (body.fromCity || '').toString().trim(),
      toCity: (body.toCity || '').toString().trim(),
      moveDate: (body.moveDate || '').toString().trim(),
      moveType: (body.moveType || '').toString().trim(),
      estimate: typeof body.estimate === 'number' ? body.estimate : null,
      source: (body.source || '').toString().trim(),
      status: 'Booking Received',
      timeline: [
        { status: 'Booking Received', at: now, note: 'Lead submitted via website' },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const env = locals?.runtime?.env;

    // 1) Persist to KV (powers the public /track/ page). Optional.
    let kvStored = false;
    try {
      const kv = env?.TRACKING_KV;
      if (kv) {
        await kv.put(trackingId, JSON.stringify(record));
        kvStored = true;
      }
    } catch {
      // KV not bound or write failed — not fatal, email backup still tries below.
    }

    // 2) Email notification backup via Resend. Optional, independent of KV.
    try {
      const resendKey = env?.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
      const notifyTo = env?.LEAD_NOTIFY_EMAIL ?? import.meta.env.LEAD_NOTIFY_EMAIL;
      if (resendKey && notifyTo) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PackersHub Leads <leads@packershub.in>',
            to: [notifyTo],
            subject: `New ${record.type} lead — ${record.name || 'Unknown'} (${trackingId})`,
            text: [
              `Tracking ID: ${trackingId}`,
              `Type: ${record.type}`,
              `Name: ${record.name || '-'}`,
              `Phone: ${record.phone}`,
              `Email: ${record.email || '-'}`,
              record.fromCity || record.toCity ? `Route: ${record.fromCity || '-'} -> ${record.toCity || '-'}` : '',
              record.moveDate ? `Move date: ${record.moveDate}` : '',
              record.moveType ? `Move type: ${record.moveType}` : '',
              record.estimate ? `Estimate shown: ₹${record.estimate}` : '',
              record.message ? `Message: ${record.message}` : '',
              `Submitted: ${now}`,
              `Saved to tracking system: ${kvStored ? 'yes' : 'no (KV not configured)'}`,
            ].filter(Boolean).join('\n'),
          }),
        });
      }
    } catch {
      // Email is a best-effort backup — never fail the request because of it.
    }

    // Always ok:true here — the front-end's WhatsApp flow must never be
    // blocked by this endpoint. trackingId is only meaningful if it was
    // actually stored in KV (otherwise /track/ would have nothing to find).
    return json({ ok: true, trackingId: kvStored ? trackingId : null });
  } catch {
    return json({ ok: false }, 200);
  }
}
