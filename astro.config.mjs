// PackersHub v10.1 — Astro 7.0.3 config
// Tailwind v3 + @astrojs/tailwind replaced with Tailwind v4 + the official
// @tailwindcss/vite plugin (the @astrojs/tailwind integration is deprecated
// upstream and only kept around for Tailwind v3 projects).

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// v10.7.26 — Detailed sitemap: real per-page priority/changefreq instead
// of one flat value for all ~450 URLs, plus real per-post `lastmod` for
// every blog post pulled from its own frontmatter (pubDate/updatedDate)
// instead of a single build-time timestamp stamped on every URL. Google
// Search Console re-crawls pages faster when lastmod actually reflects
// real content changes rather than the same "just now" on every page —
// a sitemap where every URL has an identical, ever-changing lastmod is a
// weak signal Google tends to discount.
//
// This needs zero manual upkeep going forward: it's driven entirely by
// the same cities.json / states.json / services.json / blog frontmatter
// that already exist, so every new city, service, or blog post added to
// the codebase gets a correct sitemap entry automatically — nothing to
// register by hand.

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const citySlugs = new Set(
  JSON.parse(readFileSync(join(__dirname, 'src/data/cities.json'), 'utf8'))
    .map((c) => `${c.state}/${c.slug}`)
);
const stateSlugs = new Set(
  JSON.parse(readFileSync(join(__dirname, 'src/data/states.json'), 'utf8')).map((s) => s.slug)
);
const serviceSlugs = new Set(
  JSON.parse(readFileSync(join(__dirname, 'src/data/services.json'), 'utf8')).map((s) => s.slug)
);

// Walk src/content/blog for every post's real date, keyed by its final
// /blog/<id>/ URL path — id includes the state/city subfolder, matching
// how getStaticPaths() builds the live route.
function walkMdFiles(dir) {
  let out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walkMdFiles(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}
function extractDate(content, field) {
  const m = content.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  if (!m) return null;
  const d = new Date(m[1].trim().replace(/^["']|["']$/g, ''));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const blogLastmod = {};
try {
  const BLOG_DIR = join(__dirname, 'src/content/blog');
  for (const file of walkMdFiles(BLOG_DIR)) {
    const id = relative(BLOG_DIR, file).replace(/\\/g, '/').replace(/\.md$/, '');
    const content = readFileSync(file, 'utf8');
    const date = extractDate(content, 'updatedDate') || extractDate(content, 'pubDate');
    if (date) blogLastmod[`/blog/${id}/`] = date;
  }
} catch (err) {
  console.warn('[sitemap] blog lastmod map failed, falling back to build date:', err.message);
}

const CORE_CONVERSION_PAGES = new Set([
  '/booking/', '/services/', '/contact/', '/vehicle-transport/',
  '/storage-warehousing/', '/track/', '/franchise/', '/about/',
]);
const UTILITY_PAGES = new Set(['/privacy/', '/terms/']);

function classify(pathname) {
  if (pathname === '/') return { priority: 1.0, changefreq: 'daily' };

  // /state/city/  — 100 city landing pages, the core local-SEO surface
  const cityCityMatch = pathname.match(/^\/([a-z-]+)\/([a-z-]+)\/$/);
  if (cityCityMatch && citySlugs.has(`${cityCityMatch[1]}/${cityCityMatch[2]}`)) {
    return { priority: 0.9, changefreq: 'weekly' };
  }

  // /state/  — 5 state hub pages
  const stateMatch = pathname.match(/^\/([a-z-]+)\/$/);
  if (stateMatch && stateSlugs.has(stateMatch[1])) {
    return { priority: 0.75, changefreq: 'weekly' };
  }

  // /blog/<id>/  — individual posts get real lastmod, lower base priority
  if (pathname.startsWith('/blog/') && pathname !== '/blog/' && !pathname.startsWith('/blog/page/')) {
    return { priority: 0.65, changefreq: 'monthly', lastmod: blogLastmod[pathname] };
  }
  if (pathname === '/blog/' || pathname.startsWith('/blog/page/')) {
    return { priority: 0.6, changefreq: 'weekly' };
  }

  if (CORE_CONVERSION_PAGES.has(pathname)) return { priority: 0.85, changefreq: 'monthly' };

  // /[service]/  — service detail pages
  if (stateMatch && serviceSlugs.has(stateMatch[1])) {
    return { priority: 0.8, changefreq: 'monthly' };
  }

  if (UTILITY_PAGES.has(pathname)) return { priority: 0.3, changefreq: 'yearly' };

  return { priority: 0.5, changefreq: 'monthly' };
}

export default defineConfig({
  site: 'https://www.packershub.in',
  output: 'static',
  // v10.7.6 — FIX: canonical URL strategy is now explicit instead of
  // relying on Astro's default ('ignore'), which let /city and /city/
  // both resolve with no single canonical form. 'always' matches the
  // directory-style build output (page/index.html -> served at /page/)
  // and matches every internal link/canonical URL fixed in this release
  // to end in a trailing slash. See public/_redirects for the safety-net
  // 301 that catches any remaining non-slash inbound/legacy links.
  trailingSlash: 'always',
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: { enabled: false },
  }),
  integrations: [
    sitemap({
      // Build-time fallback only — real per-page values below in
      // serialize() override this for every URL we can classify.
      changefreq: 'weekly',
      priority: 0.6,
      lastmod: new Date(),
      filter: (page) =>
        !page.includes('/admin') && !page.includes('/api/'),
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const { lastmod, ...rest } = classify(pathname);
        return {
          ...item,
          ...rest,
          ...(lastmod ? { lastmod } : {}),
        };
      },
    }),
  ],
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      optimizeDeps: { disabled: true }
    },
    build: {
      cssCodeSplit: true,
    },
  },
});
