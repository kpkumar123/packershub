// src/pages/api/payment/create-order.ts
//
// Creates a Razorpay order for advance booking payment.
//
// Flow:
//   1. BookingEngine Step 4 → customer chooses "Pay Advance ₹X"
//   2. This endpoint creates a Razorpay order and returns {orderId, amount, currency, keyId}
//   3. Front-end opens Razorpay checkout modal with those values
//   4. On success → /api/payment/verify confirms signature and updates KV status
//
// Required Cloudflare secrets (wrangler secret put ...):
//   RAZORPAY_KEY_ID       — from Razorpay Dashboard > API Keys
//   RAZORPAY_KEY_SECRET   — from Razorpay Dashboard > API Keys
//   TRACKING_KV           — already bound for /track/ and /api/lead
//
// Razorpay test keys work in dev — just swap for live keys before go-live.
// Test card: 4111 1111 1111 1111, any future expiry, any CVV.
// UPI VPA:   success@razorpay
//
// Astro 7.0.3 / Cloudflare adapter v13: env bindings via cloudflare:workers.

import { env } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://www.packershub.in',
    },
  });
}

interface CreateOrderPayload {
  trackingId: string;   // PH-XXXXXX — must already exist in KV
  amount:     number;   // full estimate amount in ₹ (rupees, not paise)
  name?:      string;
  phone?:     string;
  email?:     string;
  fromCity?:  string;
  toCity?:    string;
  advancePct?: number;  // 0–100, default 20 (advance percentage to collect)
}

// Razorpay HTTP basic-auth helper
function razorpayAuth(keyId: string, keySecret: string): string {
  const raw = `${keyId}:${keySecret}`;
  // btoa works in Workers/Cloudflare runtime
  return `Basic ${btoa(raw)}`;
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as CreateOrderPayload;

    const { trackingId, amount, name, phone, email, fromCity, toCity } = body;
    const advancePct = Math.min(100, Math.max(1, body.advancePct ?? 20));

    // ── Validate ─────────────────────────────────────────────────────────────
    if (!trackingId || !/^PH-[A-Z2-9]{6}$/.test(trackingId)) {
      return json({ ok: false, error: 'Invalid tracking ID format.' }, 400);
    }
    if (!amount || amount < 500) {
      return json({ ok: false, error: 'Amount must be at least ₹500.' }, 400);
    }

    // ── Env bindings ─────────────────────────────────────────────────────────
    const kv        = (env as any)?.TRACKING_KV;
    const keyId     = (env as any)?.RAZORPAY_KEY_ID     ?? import.meta.env.RAZORPAY_KEY_ID;
    const keySecret = (env as any)?.RAZORPAY_KEY_SECRET ?? import.meta.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return json({
        ok: false,
        error: 'Payment gateway not configured. Please call +91 77310 74075 to pay.',
      }, 503);
    }

    // ── Verify tracking record exists in KV ──────────────────────────────────
    if (kv) {
      const raw = await kv.get(trackingId);
      if (!raw) {
        return json({ ok: false, error: 'Booking not found. Please submit your booking first.' }, 404);
      }
    }

    // ── Calculate advance amount ─────────────────────────────────────────────
    const advanceRupees = Math.round((amount * advancePct) / 100);
    const amountPaise   = advanceRupees * 100; // Razorpay uses paise

    // ── Create Razorpay Order ────────────────────────────────────────────────
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': razorpayAuth(keyId, keySecret),
      },
      body: JSON.stringify({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  trackingId,  // Razorpay receipt = our tracking ID
        notes: {
          tracking_id: trackingId,
          from_city:   fromCity  || '',
          to_city:     toCity    || '',
          customer:    name      || '',
          phone:       phone     || '',
          advance_pct: `${advancePct}%`,
          full_estimate_inr: amount.toString(),
        },
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.json().catch(() => ({})) as any;
      console.error('[payment/create-order] Razorpay error:', err);
      return json({
        ok: false,
        error: err?.error?.description || 'Payment gateway error. Please try again.',
      }, 502);
    }

    const order = await rzpRes.json() as any;

    // ── Update KV: mark payment initiated ────────────────────────────────────
    if (kv) {
      try {
        const raw    = await kv.get(trackingId);
        const record = raw ? JSON.parse(raw) : {};
        record.paymentStatus    = 'initiated';
        record.razorpayOrderId  = order.id;
        record.advanceAmount    = advanceRupees;
        record.updatedAt        = new Date().toISOString();
        await kv.put(trackingId, JSON.stringify(record));
      } catch { /* non-fatal */ }
    }

    // ── Return order details to front-end ────────────────────────────────────
    return json({
      ok:       true,
      orderId:  order.id,
      amount:   amountPaise,      // paise — pass directly to Razorpay.js
      currency: 'INR',
      keyId,                      // public key — safe to expose
      advanceRupees,
      advancePct,
      prefill: {
        name:    name  || '',
        email:   email || '',
        contact: (() => {
          if (!phone) return '';
          const digits = phone.replace(/\D/g, '').slice(-10); // last 10 digits = national number
          return digits.length === 10 ? `+91${digits}` : '';
        })(),
      },
    });

  } catch (e) {
    console.error('[payment/create-order]', e);
    return json({ ok: false, error: 'Server error. Please try again.' }, 500);
  }
}

// Allow preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
  });
}
