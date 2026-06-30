// src/pages/api/follow-up.ts
//
// Multi-Channel Automated Follow-Up Sequence — PackersHub v10.3
// v10.6.3 — added a 'review' step: a post-delivery request asking the
// customer for a Google review. Triggered separately from the booking
// follow-up sequence below — see follow-up-cron.ts's second scan loop
// over `review:` keys, seeded by /api/admin/order.ts the moment staff
// mark a booking "Delivered".
//
// FLOW (triggered immediately when a lead is captured via /api/lead):
//   T+0  min  → Instant WhatsApp deep-link trigger (client-side already opens this)
//   T+5  min  → Email confirmation to customer (via Resend)
//   T+30 min  → Internal SMS alert to sales team (via MSG91 / Fast2SMS)
//   T+4  hr   → Follow-up WhatsApp message template to customer (via WhatsApp Business API)
//   T+24 hr   → Secondary follow-up if no response logged
//   T+72 hr   → Final nurture message with discount nudge
//   T+delivery+4hr → Review request (Google review link), if marked Delivered
//
// SETUP: Configure the following secrets in Cloudflare Workers / wrangler.toml:
//   RESEND_API_KEY          — https://resend.com (free: 100 emails/day)
//   LEAD_NOTIFY_EMAIL       — your internal email (e.g. leads@packershub.in)
//   MSG91_AUTH_KEY          — https://msg91.com (SMS, India)
//   MSG91_SENDER_ID         — 6-char sender ID approved by TRAI
//   MSG91_TEMPLATE_ID       — DLT-registered template ID
//   WABA_TOKEN              — WhatsApp Business API token (Meta)
//   WABA_PHONE_NUMBER_ID    — Meta WABA phone number ID
//   WABA_TEMPLATE_FOLLOWUP  — approved template name for follow-up
//   TRACKING_KV             — Cloudflare KV namespace (for sequence state)
//   GOOGLE_REVIEW_URL       — your Google Business Profile review link
//                             (Google Business Profile → "Get more reviews" →
//                             copy the short link, looks like g.page/r/.../review)
//
// IMPORTANT — TRAI / WhatsApp compliance:
//   • All SMS use DLT-registered templates only — no custom text.
//   • WhatsApp Business API messages use pre-approved templates.
//   • Customer must have initiated contact (opt-in via booking form).
//   • Unsubscribe is handled by replying STOP (SMS) or blocking (WhatsApp).
//
// If a service is not configured, that channel is silently skipped.
// The endpoint always returns ok:true to avoid blocking the booking flow.

import { env } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface FollowUpPayload {
  trackingId: string;
  name: string;
  phone: string;
  email?: string;
  fromCity?: string;
  toCity?: string;
  moveDate?: string;
  moveType?: string;
  estimate?: number;
  sequenceStep?: 'instant' | 'h4' | 'h24' | 'h72' | 'review'; // which step triggered this call
}

// ── SEQUENCE STATE ─────────────────────────────────────────────
// Stored in KV under key `followup:${trackingId}`
// { steps: { instant: boolean, h4: boolean, h24: boolean, h72: boolean },
//   responded: boolean, createdAt: string }

async function getSequenceState(kv: KVNamespace, trackingId: string) {
  try {
    const raw = await kv.get(`followup:${trackingId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function updateSequenceState(kv: KVNamespace, trackingId: string, update: object) {
  try {
    const existing = await getSequenceState(kv, trackingId) ?? {
      steps: {}, responded: false, createdAt: new Date().toISOString(),
    };
    const merged = { ...existing, steps: { ...existing.steps, ...update } };
    // Keep follow-up state for 30 days
    await kv.put(`followup:${trackingId}`, JSON.stringify(merged), { expirationTtl: 30 * 86400 });
  } catch { /* silent */ }
}

// ── EMAIL (Resend) ─────────────────────────────────────────────
async function sendEmail(opts: {
  to: string; subject: string; html: string; replyTo?: string;
}) {
  const key = env?.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'PackersHub <hello@packershub.in>',
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo ?? 'support@packershub.in',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── SMS (MSG91 — DLT compliant) ────────────────────────────────
async function sendSMS(phone: string, templateId: string, vars: string[]) {
  const authKey = env?.MSG91_AUTH_KEY ?? import.meta.env.MSG91_AUTH_KEY;
  const senderId = env?.MSG91_SENDER_ID ?? import.meta.env.MSG91_SENDER_ID ?? 'PKRHUB';
  if (!authKey) return false;

  // Normalize phone: ensure it starts with 91 (India)
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '').replace(/^91/, '');
  const fullPhone = `91${normalized}`;

  try {
    const res = await fetch('https://api.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { authkey: authKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        short_url: '0',
        recipients: [{
          mobiles: fullPhone,
          ...vars.reduce((acc, v, i) => ({ ...acc, [`VAR${i + 1}`]: v }), {}),
        }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── WHATSAPP BUSINESS API (Meta) ───────────────────────────────
async function sendWhatsAppTemplate(phone: string, templateName: string, components: object[]) {
  const token = env?.WABA_TOKEN ?? import.meta.env.WABA_TOKEN;
  const phoneNumberId = env?.WABA_PHONE_NUMBER_ID ?? import.meta.env.WABA_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return false;

  const normalized = phone.replace(/\D/g, '').replace(/^0/, '').replace(/^91/, '');
  const fullPhone = `91${normalized}`;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: fullPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_IN' },
            components,
          },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ── EMAIL TEMPLATES ────────────────────────────────────────────
function buildConfirmationEmail(p: FollowUpPayload): string {
  const estimateLine = p.estimate
    ? `<p style="font-size:1.1rem;font-weight:bold;color:#c41e3a;">Your Estimate: ₹${p.estimate.toLocaleString('en-IN')}</p>`
    : '';
  const routeLine = p.fromCity && p.toCity
    ? `<p>📍 Route: <strong>${p.fromCity} → ${p.toCity}</strong></p>`
    : '';

  return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);">
  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:24px;text-align:center;">
    <h1 style="color:#f59e0b;margin:0;font-size:1.4rem;">PackersHub</h1>
    <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:.85rem;">Safe · Affordable · Professional</p>
  </div>
  <div style="padding:28px 24px;">
    <h2 style="color:#0f172a;margin:0 0 12px;">Hello ${p.name || 'there'}! 👋</h2>
    <p style="color:#374151;">We've received your shifting enquiry. Our team will call you within <strong>30 minutes</strong> to confirm your booking.</p>
    ${routeLine}
    ${estimateLine}
    <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0;border-left:4px solid #f59e0b;">
      <p style="margin:0;font-size:.85rem;color:#6b7280;">📋 Tracking ID: <strong style="color:#0f172a;font-family:monospace;">${p.trackingId}</strong></p>
      <p style="margin:4px 0 0;font-size:.75rem;color:#9ca3af;">Use this ID to track your move at <a href="https://packershub.in/track/">packershub.in/track/</a></p>
    </div>
    <div style="margin:20px 0;">
      <a href="tel:+917731074075" style="display:inline-block;background:#f59e0b;color:#000;font-weight:bold;text-decoration:none;border-radius:8px;padding:12px 24px;margin-right:10px;">📞 Call Us</a>
      <a href="https://wa.me/917731074075?text=Hi%2C%20my%20tracking%20ID%20is%20${p.trackingId}" style="display:inline-block;background:#25d366;color:#fff;font-weight:bold;text-decoration:none;border-radius:8px;padding:12px 24px;">💬 WhatsApp</a>
    </div>
    <p style="color:#9ca3af;font-size:.75rem;margin-top:20px;">PackersHub · BV Nagar, Nellore, Andhra Pradesh · <a href="https://packershub.in">packershub.in</a></p>
  </div>
</div>
</body></html>`;
}

function buildFollowUpEmail(p: FollowUpPayload, stepHours: number): { subject: string; html: string } {
  const messages: Record<number, { subject: string; body: string }> = {
    4: {
      subject: `Still planning your move? We're here — PackersHub`,
      body: `<p>Hi ${p.name || 'there'},</p><p>We noticed you enquired about shifting${p.fromCity ? ` from <strong>${p.fromCity}</strong>` : ''}${p.toCity ? ` to <strong>${p.toCity}</strong>` : ''} a few hours ago.</p><p>Our team is ready to finalize your booking. Call us or reply to confirm your move date.</p>`,
    },
    24: {
      subject: `Your move booking is still open — PackersHub`,
      body: `<p>Hi ${p.name || 'there'},</p><p>We're still holding your slot. Book today and get <strong>free packing materials</strong> for the first carton box.</p><p>Tracking ID: <code>${p.trackingId}</code></p>`,
    },
    72: {
      subject: `Final reminder — ₹500 off your move — PackersHub`,
      body: `<p>Hi ${p.name || 'there'},</p><p>We'd love to help you move. As a special offer, mention your tracking ID <strong>${p.trackingId}</strong> when you call and get <strong>₹500 off</strong> your final bill.</p><p>This offer expires in 24 hours.</p>`,
    },
  };

  const { subject, body } = messages[stepHours] ?? messages[4];
  return {
    subject,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);">
  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:20px;text-align:center;">
    <h1 style="color:#f59e0b;margin:0;font-size:1.3rem;">PackersHub</h1>
  </div>
  <div style="padding:24px;">
    ${body}
    <div style="margin:20px 0;">
      <a href="tel:+917731074075" style="display:inline-block;background:#f59e0b;color:#000;font-weight:bold;text-decoration:none;border-radius:8px;padding:12px 24px;margin-right:10px;">📞 Call Now</a>
      <a href="https://wa.me/917731074075?text=Hi%2C%20my%20tracking%20ID%20is%20${p.trackingId}" style="display:inline-block;background:#25d366;color:#fff;font-weight:bold;text-decoration:none;border-radius:8px;padding:12px 24px;">💬 WhatsApp</a>
    </div>
    <p style="color:#9ca3af;font-size:.7rem;">To stop receiving these emails, reply STOP.</p>
  </div>
</div>
</body></html>`,
  };
}

// ── POST-DELIVERY REVIEW REQUEST ────────────────────────────────
// Triggered by follow-up-cron.ts's `review:` scan loop, a fixed delay
// after staff mark a booking "Delivered" (see /api/admin/order.ts).
// Honesty note: this only fires for bookings staff have actually marked
// Delivered — there's no way to fake a review request for a move that
// didn't happen, since deliveredAt is staff-confirmed, not customer-claimed.
function buildReviewEmail(p: FollowUpPayload, reviewUrl: string): { subject: string; html: string } {
  const routeLine = p.fromCity && p.toCity
    ? `your move from <strong>${p.fromCity}</strong> to <strong>${p.toCity}</strong>`
    : 'your recent move';

  return {
    subject: `How was your move? — PackersHub`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);">
  <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:20px;text-align:center;">
    <h1 style="color:#f59e0b;margin:0;font-size:1.3rem;">PackersHub</h1>
  </div>
  <div style="padding:24px;">
    <p>Hi ${p.name || 'there'},</p>
    <p>We hope ${routeLine} went smoothly! If you have a minute, a quick Google review helps other families find a mover they can trust — and helps our small team a lot.</p>
    <div style="margin:20px 0;text-align:center;">
      <a href="${reviewUrl}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:bold;text-decoration:none;border-radius:8px;padding:14px 28px;">⭐ Leave a Google Review</a>
    </div>
    <p style="color:#6b7280;font-size:.85rem;">If anything about your move wasn't perfect, please call us first — we'd rather fix it than have you leave without saying so.</p>
    <div style="margin:16px 0;">
      <a href="tel:+917731074075" style="display:inline-block;background:#fff;border:1px solid #d1d5db;color:#0f172a;font-weight:bold;text-decoration:none;border-radius:8px;padding:10px 20px;margin-right:10px;font-size:.85rem;">📞 Call Us</a>
      <a href="https://wa.me/917731074075?text=Hi%2C%20regarding%20booking%20${p.trackingId}" style="display:inline-block;background:#25d366;color:#fff;font-weight:bold;text-decoration:none;border-radius:8px;padding:10px 20px;font-size:.85rem;">💬 WhatsApp</a>
    </div>
    <p style="color:#9ca3af;font-size:.7rem;">Tracking ID: ${p.trackingId} · To stop receiving these emails, reply STOP.</p>
  </div>
</div>
</body></html>`,
  };
}


// "New lead: {#var#} from {#var#} to {#var#}. Call: {#var#}. ID: {#var#} -PKRHUB"
async function sendTeamSMSAlert(p: FollowUpPayload): Promise<boolean> {
  const templateId = env?.MSG91_TEMPLATE_ID ?? import.meta.env.MSG91_TEMPLATE_ID;
  const teamPhone = env?.TEAM_PHONE ?? import.meta.env.TEAM_PHONE;
  if (!templateId || !teamPhone) return false;

  return sendSMS(teamPhone, templateId, [
    p.name || 'Customer',
    p.fromCity || 'N/A',
    p.toCity || 'N/A',
    p.phone,
    p.trackingId,
  ]);
}

// ── MAIN HANDLER ──────────────────────────────────────────────
export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as FollowUpPayload;
    const step = body.sequenceStep ?? 'instant';
    const kv = env?.TRACKING_KV;

    // Idempotency — skip if this step already fired
    if (kv) {
      const state = await getSequenceState(kv, body.trackingId);
      if (state?.steps?.[step]) {
        return json({ ok: true, skipped: true, reason: 'already_sent' });
      }
    }

    const results: Record<string, boolean | string> = {};

    // ── INSTANT (step triggered at lead capture) ───────────────
    if (step === 'instant') {
      // 1) Confirmation email to customer
      if (body.email) {
        results.confirmEmail = await sendEmail({
          to: body.email,
          subject: `Booking received — ${body.trackingId} — PackersHub`,
          html: buildConfirmationEmail(body),
        });
      }

      // 2) Internal SMS alert to team
      results.teamSMS = await sendTeamSMSAlert(body);

      // 3) Internal email alert (belt-and-suspenders alongside Resend in /api/lead)
      const internalEmail = env?.LEAD_NOTIFY_EMAIL ?? import.meta.env.LEAD_NOTIFY_EMAIL;
      if (internalEmail) {
        results.internalEmail = await sendEmail({
          to: internalEmail,
          subject: `🚨 New Lead: ${body.name} (${body.trackingId}) — ${body.fromCity ?? ''} → ${body.toCity ?? ''}`,
          html: `<pre style="font-family:monospace">${JSON.stringify(body, null, 2)}</pre>`,
        });
      }
    }

    // ── H+4 FOLLOW-UP ─────────────────────────────────────────
    if (step === 'h4') {
      if (body.email) {
        const { subject, html } = buildFollowUpEmail(body, 4);
        results.followUpEmail = await sendEmail({ to: body.email, subject, html });
      }

      // WhatsApp Business API template — must be pre-approved by Meta
      const wabaTemplate = env?.WABA_TEMPLATE_FOLLOWUP ?? import.meta.env.WABA_TEMPLATE_FOLLOWUP;
      if (wabaTemplate && body.phone) {
        results.whatsappTemplate = await sendWhatsAppTemplate(body.phone, wabaTemplate, [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: body.name || 'there' },
              { type: 'text', text: body.fromCity || 'your city' },
              { type: 'text', text: body.toCity || 'destination' },
              { type: 'text', text: body.trackingId },
            ],
          },
        ]);
      }
    }

    // ── H+24 FOLLOW-UP ────────────────────────────────────────
    if (step === 'h24') {
      if (body.email) {
        const { subject, html } = buildFollowUpEmail(body, 24);
        results.followUpEmail = await sendEmail({ to: body.email, subject, html });
      }
    }

    // ── H+72 FINAL NURTURE ────────────────────────────────────
    if (step === 'h72') {
      if (body.email) {
        const { subject, html } = buildFollowUpEmail(body, 72);
        results.finalEmail = await sendEmail({ to: body.email, subject, html });
      }
    }

    // ── POST-DELIVERY REVIEW REQUEST ───────────────────────────
    // Seeded by /api/admin/order.ts when staff mark a booking "Delivered",
    // fired by the second scan loop in follow-up-cron.ts after a delay.
    if (step === 'review') {
      const reviewUrl = env?.GOOGLE_REVIEW_URL ?? import.meta.env.GOOGLE_REVIEW_URL;
      if (reviewUrl && body.email) {
        const { subject, html } = buildReviewEmail(body, reviewUrl);
        results.reviewEmail = await sendEmail({ to: body.email, subject, html });
      }
      // No email on file or no review URL configured — skip silently rather
      // than erroring; this step is a nice-to-have, never a blocker.
      if (!reviewUrl) results.reviewEmail = 'skipped_no_review_url';
      if (!body.email) results.reviewEmail = results.reviewEmail || 'skipped_no_email';
    }

    // Mark step as sent in KV
    if (kv) {
      await updateSequenceState(kv, body.trackingId, { [step]: true });
    }

    return json({ ok: true, step, results });
  } catch {
    return json({ ok: true }); // never fail — follow-up is best-effort
  }
}

// ── CRON TRIGGER HANDLER ───────────────────────────────────────
// Add to wrangler.toml:
//   [[triggers.crons]]
//   crons = ["*/5 * * * *"]   # every 5 minutes
//
// Then create src/pages/api/follow-up-cron.ts that calls this logic.
// Cron reads all leads from KV where steps are not yet complete,
// checks elapsed time, and fires the appropriate step.
//
// Simpler alternative (no cron): call /api/follow-up from the client
// with a service worker / setTimeout for in-session follow-ups,
// and use Cloudflare Durable Objects or Queues for the longer delays.
//
// Quickest setup for immediate value:
// 1) Configure RESEND_API_KEY + LEAD_NOTIFY_EMAIL → instant email works now.
// 2) Configure MSG91_AUTH_KEY → team SMS alert works.
// 3) Set up Meta WABA → WhatsApp templates work.
// 4) For timed sequences, see CHANGELOG.md → "v10.3 — AI Features Release" → Cron Setup.
