// src/pages/api/payment/verify.ts
//
// Verifies Razorpay payment signature after checkout completes.
//
// Security: Razorpay signs every successful payment with HMAC-SHA256.
//   signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
// We verify this server-side using Web Crypto — no npm dependency needed.
//
// On success:
//   - KV record updated: status → "Advance Paid", paymentStatus → "paid"
//   - Timeline entry added with payment details
//   - Confirmation email fired via Resend (if configured)
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

interface VerifyPayload {
  trackingId:           string;
  razorpayOrderId:      string;
  razorpayPaymentId:    string;
  razorpaySignature:    string;
  isFullPayment?:       boolean; // v10.6.3 — true when customer chose "Pay Full Amount"
}

// HMAC-SHA256 using Web Crypto API (available in Cloudflare Workers)
async function verifyHmac(
  secret: string,
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const enc     = new TextEncoder();
  const keyData = enc.encode(secret);
  const message = enc.encode(`${orderId}|${paymentId}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  // Convert hex signature to Uint8Array
  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)!.map(b => parseInt(b, 16)),
  );

  return crypto.subtle.verify('HMAC', cryptoKey, sigBytes, message);
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = (await request.json()) as VerifyPayload;
    const { trackingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, isFullPayment } = body;

    if (!trackingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return json({ ok: false, error: 'Missing payment verification fields.' }, 400);
    }

    const kv        = (env as any)?.TRACKING_KV;
    const keySecret = (env as any)?.RAZORPAY_KEY_SECRET ?? import.meta.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return json({ ok: false, error: 'Payment gateway not configured.' }, 503);
    }

    // ── Verify HMAC signature ─────────────────────────────────────────────────
    const valid = await verifyHmac(keySecret, razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!valid) {
      console.warn('[payment/verify] Invalid signature for', trackingId);
      return json({ ok: false, error: 'Payment signature verification failed. Please call us.' }, 400);
    }

    // ── Update KV record ──────────────────────────────────────────────────────
    const now = new Date().toISOString();
    if (kv) {
      try {
        const raw    = await kv.get(trackingId);
        const record = raw ? JSON.parse(raw) : { trackingId };

        record.status           = 'Advance Paid'; // KV/timeline stage key stays the same so existing
                                                    // /track/ and /admin/orders.astro stage logic keeps
                                                    // working unmodified — the distinction lives in
                                                    // paymentStatus + paymentType below instead.
        record.paymentStatus    = 'paid';
        record.paymentType      = isFullPayment ? 'full' : 'advance'; // v10.6.3
        record.razorpayPaymentId = razorpayPaymentId;
        record.paidAt           = now;
        record.updatedAt        = now;

        // Add timeline entry
        if (!Array.isArray(record.timeline)) record.timeline = [];
        record.timeline.push({
          status: 'Advance Paid',
          at:     now,
          note:   isFullPayment
            ? `Full payment received. Payment ID: ${razorpayPaymentId}`
            : `Advance payment confirmed. Payment ID: ${razorpayPaymentId}`,
        });

        await kv.put(trackingId, JSON.stringify(record));

        // ── Fire confirmation email (best-effort) ─────────────────────────────
        const resendKey = (env as any)?.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
        const notifyTo  = (env as any)?.LEAD_NOTIFY_EMAIL ?? import.meta.env.LEAD_NOTIFY_EMAIL;

        if (resendKey && notifyTo) {
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'PackersHub Payments <payments@packershub.in>',
              to: [notifyTo],
              subject: isFullPayment ? `✅ Full Payment Received — ${trackingId}` : `✅ Payment Received — ${trackingId}`,
              text: [
                `Tracking ID:  ${trackingId}`,
                `Payment Type: ${isFullPayment ? 'FULL PAYMENT' : 'Advance'}`,
                `Payment ID:   ${razorpayPaymentId}`,
                `Razorpay Order: ${razorpayOrderId}`,
                `Route: ${record.fromCity || '-'} → ${record.toCity || '-'}`,
                `Customer: ${record.name || '-'} / ${record.phone || '-'}`,
                `Paid at: ${now}`,
              ].join('\n'),
            }),
          }).catch(() => {});

          // Notify customer if email present
          if (record.email) {
            fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'PackersHub <noreply@packershub.in>',
                to: [record.email],
                subject: isFullPayment
                  ? `Payment Confirmed — Booking ${trackingId} Fully Paid`
                  : `Payment Confirmed — Your PackersHub Booking ${trackingId}`,
                text: [
                  `Dear ${record.name || 'Customer'},`,
                  '',
                  isFullPayment
                    ? `Your full payment has been confirmed for booking ${trackingId}. Nothing is due after delivery.`
                    : `Your advance payment has been confirmed for booking ${trackingId}.`,
                  `Route: ${record.fromCity || '-'} → ${record.toCity || '-'}`,
                  `Payment ID: ${razorpayPaymentId}`,
                  '',
                  `You can track your move at: https://www.packershub.in/track/`,
                  '',
                  'Our team will contact you shortly to confirm the move date and packing crew.',
                  '',
                  'Thank you for choosing PackersHub.',
                  'Team PackersHub | +91 77310 74075 | packershub.in',
                ].join('\n'),
              }),
            }).catch(() => {});
          }
        }

      } catch (e) {
        console.error('[payment/verify] KV update failed:', e);
        // Payment is verified — don't return error to customer even if KV fails
      }
    }

    return json({
      ok:            true,
      trackingId,
      paymentId:     razorpayPaymentId,
      status:        'Advance Paid',
      paymentType:   isFullPayment ? 'full' : 'advance',
      message:       isFullPayment
        ? 'Payment confirmed! Your booking is fully paid — nothing due later.'
        : 'Payment confirmed! Your booking is now secured.',
    });

  } catch (e) {
    console.error('[payment/verify]', e);
    return json({ ok: false, error: 'Verification error. Please call +91 77310 74075.' }, 500);
  }
}
