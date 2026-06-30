/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// PackersHub v10.1 — Astro 7.0.3 + @astrojs/cloudflare v13
//
// v13 removed `Astro.locals.runtime` entirely. Environment bindings are now
// read via `import { env } from 'cloudflare:workers'` inside API routes
// (see src/pages/api/*.ts), which is typed against the GLOBAL
// `Cloudflare.Env` namespace below — not a locally-declared `Env` interface.
// Run `npm run types` (wrangler types) after adding a new binding in
// wrangler.toml to regenerate/cross-check this list.

declare global {
  namespace Cloudflare {
    interface Env {
      // KV namespace — order tracking (/track/, /admin/orders/)
      TRACKING_KV?: KVNamespace;
      // Email notification backup (Resend)
      RESEND_API_KEY?: string;
      LEAD_NOTIFY_EMAIL?: string;
      // Admin panel auth token
      ADMIN_TOKEN?: string;
      // GA4 (also available as import.meta.env.PUBLIC_GA_MEASUREMENT_ID)
      GA4_ID?: string;
      // Anthropic API key for ChatBot / AI Phone Agent
      ANTHROPIC_API_KEY?: string;
      // Follow-up sequence (src/pages/api/follow-up.ts)
      MSG91_AUTH_KEY?: string;
      MSG91_SENDER_ID?: string;
      MSG91_TEMPLATE_ID?: string;
      WABA_TOKEN?: string;
      WABA_PHONE_NUMBER_ID?: string;
      WABA_TEMPLATE_FOLLOWUP?: string;
      TEAM_PHONE?: string;
      // Google review request link (src/pages/api/follow-up.ts)
      GOOGLE_REVIEW_URL?: string;
      // Cron endpoint shared-secret (src/pages/api/follow-up-cron.ts)
      CRON_SECRET?: string;
      // Search Console indexing notifications (src/pages/api/index-notify.ts)
      GOOGLE_SA_EMAIL?: string;
      GOOGLE_SA_KEY?: string;
      // Absolute site URL for emails / schema
      SITE_URL?: string;
    }
  }
}

export {};
