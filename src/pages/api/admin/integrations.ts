// src/pages/api/admin/integrations.ts
//
// Staff-only endpoint behind /admin/integrations/. Same shared-secret
// pattern as /api/admin/order.ts and /api/admin/seo-ops.ts (ADMIN_TOKEN via
// x-admin-token header) — deliberately NOT rendered server-side on the page
// itself, because "which secrets are missing" (especially "ADMIN_TOKEN
// itself is missing") is exactly the kind of thing that should stay behind
// the same auth gate as everything else in /admin/, not be visible to
// anyone who finds the URL before they've entered a token.
//
// Only returns booleans (configured / not configured) — never a secret's
// actual value, even to an authenticated caller. There's no legitimate
// reason for this endpoint to echo back a Razorpay key or Twilio token.
import { env } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function checkAuth(request: Request): boolean {
  const expected = env?.ADMIN_TOKEN ?? import.meta.env.ADMIN_TOKEN;
  if (!expected) return false; // refuse by default if no token has been configured
  const provided = request.headers.get('x-admin-token');
  return !!provided && provided === expected;
}

const has = (v: string | undefined) => typeof v === 'string' && v.trim().length > 0;

export async function GET({ request }: { request: Request }) {
  if (!checkAuth(request)) return json({ ok: false, error: 'Unauthorized' }, 401);

  const e = env as Partial<Cloudflare.Env>;
  const gaConfigured = has(import.meta.env.PUBLIC_GA_MEASUREMENT_ID);

  const groups = [
    {
      name: 'Google Analytics 4',
      feature: 'Traffic/conversion data in Analytics.astro — without this, you have zero visibility into what visitors do on the site.',
      allRequired: true,
      rows: [{ key: 'PUBLIC_GA_MEASUREMENT_ID', configured: gaConfigured }],
    },
    {
      name: 'Razorpay Checkout',
      feature: 'Booking payment step (api/payment/create-order.ts, verify.ts) — unlike most integrations here, this one fails loudly at checkout if unset, it does not silently skip.',
      allRequired: true,
      rows: [
        { key: 'RAZORPAY_KEY_ID', configured: has(e.RAZORPAY_KEY_ID) },
        { key: 'RAZORPAY_KEY_SECRET', configured: has(e.RAZORPAY_KEY_SECRET) },
      ],
    },
    {
      name: 'Lead Notifications (Email)',
      feature: 'Resend email to your team the moment a lead comes in (api/follow-up.ts).',
      allRequired: true,
      rows: [
        { key: 'RESEND_API_KEY', configured: has(e.RESEND_API_KEY) },
        { key: 'LEAD_NOTIFY_EMAIL', configured: has(e.LEAD_NOTIFY_EMAIL) },
      ],
    },
    {
      name: 'Follow-up SMS (MSG91)',
      feature: 'T+30min internal SMS alert to sales team (api/follow-up.ts).',
      allRequired: true,
      rows: [
        { key: 'MSG91_AUTH_KEY', configured: has(e.MSG91_AUTH_KEY) },
        { key: 'MSG91_SENDER_ID', configured: has(e.MSG91_SENDER_ID) },
        { key: 'MSG91_TEMPLATE_ID', configured: has(e.MSG91_TEMPLATE_ID) },
      ],
    },
    {
      name: 'Follow-up WhatsApp (Meta WABA)',
      feature: 'T+4hr / T+24hr / T+72hr customer follow-up sequence + review request (api/follow-up.ts).',
      allRequired: true,
      rows: [
        { key: 'WABA_TOKEN', configured: has(e.WABA_TOKEN) },
        { key: 'WABA_PHONE_NUMBER_ID', configured: has(e.WABA_PHONE_NUMBER_ID) },
        { key: 'WABA_TEMPLATE_FOLLOWUP', configured: has(e.WABA_TEMPLATE_FOLLOWUP) },
        { key: 'TEAM_PHONE', configured: has(e.TEAM_PHONE) },
      ],
    },
    {
      name: 'Google Review Request',
      feature: 'Post-delivery "please review us" nudge (api/follow-up.ts) — also the fastest path to fixing the empty reviews.json / missing AggregateRating gap.',
      allRequired: true,
      rows: [{ key: 'GOOGLE_REVIEW_URL', configured: has(e.GOOGLE_REVIEW_URL) }],
    },
    {
      name: 'AI Chat / Voice Agent',
      feature: 'Website ChatBot + Twilio phone agent (api/chat.ts, api/voice/*.ts).',
      allRequired: false,
      rows: [
        { key: 'ANTHROPIC_API_KEY', configured: has(e.ANTHROPIC_API_KEY) },
        { key: 'TWILIO_AUTH_TOKEN', configured: has(e.TWILIO_AUTH_TOKEN) },
      ],
    },
    {
      name: 'Search Console Indexing API',
      feature: 'Programmatic "please crawl this page now" pings (api/index-notify.ts) — helps the 100 city pages get indexed faster.',
      allRequired: false,
      rows: [
        { key: 'GOOGLE_SA_EMAIL', configured: has(e.GOOGLE_SA_EMAIL) },
        { key: 'GOOGLE_SA_KEY', configured: has(e.GOOGLE_SA_KEY) },
      ],
    },
    {
      name: 'Security — Admin Panel',
      feature: 'Staff-token gate on /admin/orders/, /admin/seo-ops/, and this page. If unset, these internal pages are unprotected — high priority, not optional. (You clearly have this one set, since it just authenticated you.)',
      allRequired: true,
      rows: [{ key: 'ADMIN_TOKEN', configured: has(e.ADMIN_TOKEN) }],
    },
    {
      name: 'Security — Cron / Ops Endpoints',
      feature: 'Protects /api/follow-up-cron, /api/index-notify (AUTO_INDEX_TOKEN), and driver GPS pushes (GPS_ADMIN_TOKEN) from being called by anyone who finds the URL.',
      allRequired: false,
      rows: [
        { key: 'CRON_SECRET', configured: has(e.CRON_SECRET) },
        { key: 'AUTO_INDEX_TOKEN', configured: has(e.AUTO_INDEX_TOKEN) },
        { key: 'GPS_ADMIN_TOKEN', configured: has(e.GPS_ADMIN_TOKEN) },
      ],
    },
    {
      name: 'Order Tracking',
      feature: '"Track Your Move" feature (/track/, /admin/orders/) — this is a KV namespace binding in wrangler.toml, not a secret, so "configured" here just means the binding resolved at request time. Confirm separately in wrangler.toml if this shows missing.',
      allRequired: true,
      rows: [{ key: 'TRACKING_KV (binding)', configured: !!e.TRACKING_KV }],
    },
    {
      name: 'Site URL',
      feature: 'Absolute links in emails / schema fallbacks.',
      allRequired: true,
      rows: [{ key: 'SITE_URL', configured: has(e.SITE_URL) }],
    },
  ];

  return json({ ok: true, groups });
}
