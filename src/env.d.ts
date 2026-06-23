/// <reference types="astro/client" />

// Cloudflare runtime bindings (available via Astro.locals.runtime.env on
// every server-rendered route — i.e. any file with `export const prerender
// = false`). These are configured in wrangler.toml / the Cloudflare Pages
// dashboard. See SETUP_NEW_FEATURES.md for how to create each one.
type CloudflareEnv = {
  // Secrets (Settings → Environment Variables → Secrets in Cloudflare Pages)
  ANTHROPIC_API_KEY?: string;
  RESEND_API_KEY?: string;
  LEAD_NOTIFY_EMAIL?: string;
  ADMIN_TOKEN?: string;

  // Bindings (Settings → Functions → KV namespace bindings)
  TRACKING_KV?: KVNamespace;
};

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}
