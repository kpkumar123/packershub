// src/pages/api/index-notify.ts
//
// Google Indexing API — instant crawl request.
//
// Call this endpoint AFTER publishing/updating any page so Google re-crawls
// it within minutes instead of waiting for the next crawl cycle.
//
// ── SETUP (one-time, 10 min) ─────────────────────────────────────────────
// 1. Google Search Console → Settings → Ownership verification → verify
//    packershub.in (if not already done).
// 2. Google Cloud Console → new project "PackersHub" → enable
//    "Web Search Indexing API".
// 3. IAM → Service Accounts → Create → name "packershub-indexing".
//    Grant role: "Owner" (or "Service Account Token Creator").
// 4. Keys tab → Add Key → JSON → download the file.
// 5. In that JSON file, copy the value of "private_key" and "client_email".
// 6. Cloudflare Pages → Settings → Environment variables → add:
//      GOOGLE_SA_EMAIL    = the client_email value
//      GOOGLE_SA_KEY      = the private_key value  (paste the full -----BEGIN...-----END----- block)
// 7. Also add the service account email as an Owner in Search Console:
//    Search Console → Settings → Users & permissions → Add user.
// ─────────────────────────────────────────────────────────────────────────
//
// USAGE (called automatically by blog publish / sitemap ping):
//   POST /api/index-notify
//   Body: { "url": "https://www.packershub.in/blog/my-post/", "type": "URL_UPDATED" }
//   type: "URL_UPDATED" | "URL_DELETED"
//
// SITEMAP PING (optional bonus — also triggers Google's sitemap re-fetch):
//   POST /api/index-notify
//   Body: { "pingType": "sitemap" }
//
// Both types can be sent in one call:
//   Body: { "url": "...", "type": "URL_UPDATED", "pingType": "sitemap" }

import { env as cfEnv } from 'cloudflare:workers';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Minimal RS256 JWT signer using Web Crypto ─────────────────────────────
// Cloudflare Workers support SubtleCrypto — no Node.js crypto needed.

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeJWT(email: string, rawKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );

  const signing = `${header}.${payload}`;

  // Strip PEM headers and decode
  const pemContents = rawKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '\n')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signing)
  );

  return `${signing}.${base64url(sig)}`;
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const jwt = await makeJWT(email, privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Token error: ${data.error ?? 'unknown'}`);
  return data.access_token;
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST({ request }: { request: Request }) {
  try {
    const env = cfEnv as Record<string, string | undefined>;

    // ── Optional shared-token check ─────────────────────────────────────
    // Set AUTO_INDEX_TOKEN as a Cloudflare Pages env var to lock this
    // endpoint down (recommended once the GitHub Actions auto-index
    // workflow is wired up, so randoms can't burn your 200/day quota).
    // If AUTO_INDEX_TOKEN is left unset, the endpoint stays open exactly
    // like before — no breaking change for existing setups.
    const requiredToken = env?.AUTO_INDEX_TOKEN ?? (import.meta.env.AUTO_INDEX_TOKEN as string | undefined);
    if (requiredToken) {
      const providedToken = request.headers.get('X-Auto-Index-Token');
      if (providedToken !== requiredToken) {
        return json({ ok: false, error: 'Invalid or missing X-Auto-Index-Token header.' }, 401);
      }
    }

    const body = (await request.json()) as {
      url?: string;
      type?: 'URL_UPDATED' | 'URL_DELETED';
      pingType?: 'sitemap';
    };

    const saEmail = env?.GOOGLE_SA_EMAIL ?? (import.meta.env.GOOGLE_SA_EMAIL as string | undefined);
    const saKey   = env?.GOOGLE_SA_KEY   ?? (import.meta.env.GOOGLE_SA_KEY   as string | undefined);

    const results: Record<string, unknown> = {};

    // ── 1. Google Indexing API call (URL_UPDATED / URL_DELETED) ────────────
    if (body.url) {
      if (!saEmail || !saKey) {
        results.indexing = {
          ok: false,
          reason: 'GOOGLE_SA_EMAIL or GOOGLE_SA_KEY not configured in Cloudflare env vars.',
        };
      } else {
        try {
          const token = await getAccessToken(saEmail, saKey);

          const gRes = await fetch(
            'https://indexing.googleapis.com/v3/urlNotifications:publish',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: body.url,
                type: body.type ?? 'URL_UPDATED',
              }),
            }
          );

          const gData = await gRes.json();
          results.indexing = { ok: gRes.ok, status: gRes.status, response: gData };
        } catch (err) {
          results.indexing = { ok: false, error: String(err) };
        }
      }
    }

    // ── 2. Sitemap ping (Google + Bing) ────────────────────────────────────
    if (body.pingType === 'sitemap') {
      const sitemapUrl = encodeURIComponent('https://www.packershub.in/sitemap-index.xml');

      const pings = await Promise.allSettled([
        fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`),
        fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`),
      ]);

      results.sitemapPing = {
        google: pings[0].status === 'fulfilled' ? { ok: (pings[0].value as Response).ok, status: (pings[0].value as Response).status } : { ok: false },
        bing:   pings[1].status === 'fulfilled' ? { ok: (pings[1].value as Response).ok, status: (pings[1].value as Response).status } : { ok: false },
      };
    }

    return json({ ok: true, results });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 200);
  }
}
