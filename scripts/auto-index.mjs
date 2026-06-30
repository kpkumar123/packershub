// scripts/auto-index.mjs
//
// Runs inside .github/workflows/auto-google-index.yml on every push to main.
// Looks at which files changed in this push, works out which live URLs
// need a fresh Google crawl, and calls the already-deployed
// /api/index-notify endpoint for each one — same endpoint the
// /admin/index-ping/ panel uses, just automated.
//
// Logic:
//   1. Single static page file changed (e.g. src/pages/about.astro)
//      → notify that one URL directly via the Indexing API.
//   2. Single blog post file changed (src/content/blog/<slug>.md)
//      → notify that one blog URL directly.
//   3. Anything that affects MANY pages at once (shared components,
//      layouts, cities.json/states.json data, the dynamic city/state
//      route templates, global CSS, etc.) → don't burn the 200/day
//      Indexing API quota guessing — just ping the sitemap instead,
//      which tells Google + Bing to re-crawl the whole sitemap.
//   4. Sitemap ping always runs, regardless of what changed — cheap
//      and unlimited, so it's a safe catch-all on every push.

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const SITE_URL = (process.env.SITE_URL || 'https://www.packershub.in').replace(/\/$/, '');
const ENDPOINT = `${SITE_URL}/api/index-notify`;
const TOKEN = process.env.AUTO_INDEX_TOKEN || '';
const BEFORE = process.env.BEFORE_SHA || '';
const AFTER = process.env.AFTER_SHA || 'HEAD';

// ── 1. Work out changed files for this push ────────────────────────────────

function getChangedFiles() {
  // BEFORE is all-zeros on a repo's very first push, or empty on some
  // trigger edge cases — fall back to "just the last commit" in that case.
  const isUsableBeforeSha = BEFORE && !/^0+$/.test(BEFORE);
  const range = isUsableBeforeSha ? `${BEFORE} ${AFTER}` : `${AFTER}~1 ${AFTER}`;

  try {
    const out = execSync(`git diff --name-only ${range}`, { encoding: 'utf8' });
    return out.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch (err) {
    console.error('git diff failed, falling back to sitemap-only ping:', String(err));
    return [];
  }
}

// ── 2. Static file → URL map (one file, one page) ──────────────────────────

const STATIC_PAGE_MAP = {
  'src/pages/index.astro': '/',
  'src/pages/about.astro': '/about/',
  'src/pages/services.astro': '/services/',
  'src/pages/contact.astro': '/contact/',
  'src/pages/franchise.astro': '/franchise/',
  'src/pages/booking.astro': '/booking/',
  'src/pages/vehicle-transport.astro': '/vehicle-transport/',
  'src/pages/storage-warehousing.astro': '/storage-warehousing/',
  'src/pages/privacy.astro': '/privacy/',
  'src/pages/terms.astro': '/terms/',
  'src/pages/blog/index.astro': '/blog/',
};

// Files that touch many/all pages at once — too expensive (and pointless)
// to enumerate individually. A sitemap ping covers these.
const SITE_WIDE_PREFIXES = [
  'src/components/',
  'src/layouts/',
  'src/styles/',
  'src/pages/[state]/',
  'src/data/cities.json',
  'src/data/states.json',
  'astro.config.mjs',
];

function slugFromBlogPath(path) {
  // src/content/blog/how-to-pack-for-a-move.md -> how-to-pack-for-a-move
  const m = path.match(/^src\/content\/blog\/([^/]+)\.mdx?$/);
  return m ? m[1] : null;
}

function resolveUrlsForChangedFiles(files) {
  const urls = new Set();
  let touchesSiteWide = false;

  for (const file of files) {
    if (STATIC_PAGE_MAP[file]) {
      urls.add(STATIC_PAGE_MAP[file]);
      continue;
    }

    const blogSlug = slugFromBlogPath(file);
    if (blogSlug) {
      urls.add(`/blog/${blogSlug}/`);
      continue;
    }

    if (SITE_WIDE_PREFIXES.some((prefix) => file.startsWith(prefix))) {
      touchesSiteWide = true;
    }
  }

  return { urls: [...urls], touchesSiteWide };
}

// ── 3. Call the existing index-notify endpoint ──────────────────────────────

async function notify(body) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['X-Auto-Index-Token'] = TOKEN;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`→ ${JSON.stringify(body)} :: HTTP ${res.status}`, JSON.stringify(data));
  } catch (err) {
    console.error(`✗ Failed to notify for ${JSON.stringify(body)}:`, String(err));
  }
}

// ── 4. Run ───────────────────────────────────────────────────────────────

async function main() {
  const files = getChangedFiles();
  console.log(`Changed files in this push (${files.length}):`);
  files.forEach((f) => console.log(`  - ${f}`));

  const { urls, touchesSiteWide } = resolveUrlsForChangedFiles(files);

  for (const path of urls) {
    await notify({ url: `${SITE_URL}${path}`, type: 'URL_UPDATED' });
  }

  // Always ping the sitemap — unlimited quota, cheap insurance, and the
  // only signal we send when a site-wide file (component/layout/data) changed.
  await notify({ pingType: 'sitemap' });

  if (touchesSiteWide) {
    console.log('Site-wide file(s) changed — relied on sitemap ping instead of per-URL calls.');
  }
  if (urls.length === 0 && !touchesSiteWide) {
    console.log('No indexable page changes detected in this push — sitemap ping sent anyway.');
  }
}

main();
