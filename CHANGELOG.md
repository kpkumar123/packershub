# PackersHub — Changelog

Consolidated from 7 separate `CHANGES_v10.x_*.md` release files into one
chronological document. Astro 7.0.3 · Cloudflare Pages adapter v13 ·
Tailwind v4. Newest release at the top.

## v10.7.34 — Project-wide mojibake fix (box-drawing characters)

- Root cause of the recurring "corrupted characters" (e.g. `â”€â”€â”€`) found:
  16 files used Unicode box-drawing characters (`═`, `─`, `║`, etc.) as
  decorative comment dividers. These are valid UTF-8 in the file itself,
  but render as mojibake in any tool/editor that reads the file with a
  non-UTF-8 encoding assumption (common on Windows).
- Replaced every box-drawing character project-wide with plain ASCII
  (`=`, `-`, `|`) so the issue cannot recur regardless of the editor or
  OS opening the files. Affected: RazorpayCheckout.astro,
  AIVideoSurvey.astro, BookingEngine.astro, global.css, index.astro,
  admin/orders.astro, [state]/[city].astro, [state]/index.astro,
  track/index.astro, 5 api/*.ts files, scripts/auto-index.mjs.
- Verified every .astro/.ts/.js/.mjs/.json/.md/.css file in the project
  is valid UTF-8 with no BOM.
- Re-verified: RazorpayCheckout.astro script passes `node --check`;
  [city].astro frontmatter type-checks clean against real data files.

## v10.7.33 — [city].astro / RazorpayCheckout.astro audit

- Full manual + tsc syntax/type audit of `src/pages/[state]/[city].astro`
  and `src/components/RazorpayCheckout.astro`: no corruption, no encoding
  issues, frontmatter type-checks clean against real cities.json/states.json,
  RazorpayCheckout's `<script>` block passes `node --check` with zero errors.
- Fixed one real issue: unescaped `&` in visible JSX text ("Intercity &
  Interstate Moves" in the Popular Routes tab label) — changed to `&amp;`
  per HTML/JSX text-node rules. This was the only genuine defect found in
  either file.

---

## v10.7.32 — Deploy-readiness audit fixes (blog content)

**Context:** pre-deploy audit of the v10.7.31 build found two content bugs
introduced during the batch blog-generation/merge process. Both fixed
directly in `src/content/blog/`, no template or schema changes needed.

- **Build-breaking:** 36 Tamil Nadu blog posts had an `image:` frontmatter
  path one directory level too shallow (`../../assets/blog/...` instead of
  `../../../assets/blog/...`), which Astro's `image()` schema helper cannot
  resolve at build time — `astro build` would fail on these files. Fixed
  by correcting the relative path on all 36; verified every `image:` path
  in every blog post now resolves to a real file on disk.
- **Content bug:** 26 blog posts had a stray leftover `# CityName` heading
  bleeding in from the batch-merge step (9 mid-article, from a different
  city than the article's own; 17 as a trailing fragment at the end of
  the file). Removed all 26; spot-checked the surrounding paragraphs read
  cleanly with no missing text.

## v10.7.31 — ServiceAreas component redesign

Redesigned per owner feedback: the three category groups (Premium
Residential / Commercial Hub / High-Density Residential) previously
rendered as three separate cards. Now rendered as one combined card with
three internal labelled sections instead.

## v10.7.28 – v10.7.30 — undocumented

No changelog notes or version-tagged code comments were found in the
codebase for these three versions — only the `package.json` version
number was bumped. If specific changes were made here, they weren't
recorded; add a real entry if you remember what changed.

## v10.7.27 — Landing page de-duplication pass (homepage, 5 state pages, 100 city pages)

**Context:** the homepage, `[state]/index.astro`, and `[state]/[city].astro`
templates each independently carried the same "100% Safe Delivery Guarantee"
block (header + 6-step card, verbatim across all three) plus a "bottom CTA
strip" repeated after the routes grid — meaning the same Call/WhatsApp/
Get-Quote block appeared 4-6 times per page. On the homepage the guarantee
section's own closing CTA sat directly above a second, near-identical
"FINAL CTA BANNER", and both sat *after* the quote form and FAQ — asking
twice, after the ask already happened.

Fixed on all three templates (cascades to all 106 generated pages — 1
homepage + 5 state pages + 100 city pages, since city/state pages are Astro
dynamic routes, not separate files):
- Removed the repeated "bottom CTA strip" boxes after each routes grid;
  replaced with a single inline line (still links to call, no lost content).
- Removed the guarantee section's own badges row + closing CTA box on all
  three templates — the 6-step guarantee card itself (the actually unique
  content) stays, so it isn't shown twice per page anymore.
- Homepage: moved the guarantee section ahead of the quote form/FAQ (trust
  before the ask, not repeated after it) and removed the now-redundant
  second CTA banner that duplicated the final banner already at page end.
- Net: index.astro 436→389 lines, [state]/index.astro 340→294 lines,
  [state]/[city].astro 567→512 lines, with no unique content removed —
  only repeated CTA/guarantee blocks consolidated to one instance per page.

**Still open for a full 100/100 pass** (flagged, not done in this pass —
each needs either a design decision or live account access, not just code):
- Visual redesign beyond de-duplication (typography/spacing system, hero
  imagery, reducing emoji-as-icon usage) — needs your sign-off on direction
  before a full pass, since it touches every section on every page.
- AEO/GEO/AIO score claims: these aren't standardized, auditable metrics
  (no tool reports "100/100 GEO") — schema, FAQ, and content-freshness
  signals are already in place per past audits; further gains need real
  GSC/Semrush data, which requires those connected accounts.

## v10.7.26 — Detailed Sitemap (real per-page priority + real lastmod)

**Context first:** the site already had an automatic sitemap — `@astrojs/sitemap`
has been in `astro.config.mjs`'s integrations since early versions. Because
`output: 'static'`, every page the build actually generates — homepage, all
100 city pages, all 5 state pages, every service page, and all 345 blog
posts (340 city posts + 5 general) — is picked up into `sitemap-index.xml`
automatically, with zero manual URL registration, and stays that way as new
cities/posts are added. `/admin/*` and `/api/*` are excluded via `filter`.
So "does every landing page and blog post get into the sitemap
automatically" was already yes — that part needed no fix.

**What was actually thin, and what this pass fixed:** every one of those
~450 URLs previously shared one flat `priority: 0.8` and one identical
`lastmod` (a single `new Date()` evaluated once at build time and stamped
on every URL, regardless of whether that page's content changed). A
sitemap where everything has the same priority and every URL claims to
have "just changed" is a weak signal — Google's own guidance is that
`lastmod` should reflect a real content change, and identical values
across a whole sitemap tend to get discounted.

Added a `serialize()` callback that classifies each URL against the same
`cities.json` / `states.json` / `services.json` already used elsewhere in
the codebase (so it needs no separate list to maintain) and assigns:

| Page type | Priority | Changefreq | lastmod |
|---|---|---|---|
| Homepage | 1.0 | daily | build time |
| City pages (100) | 0.9 | weekly | build time |
| State pages (5) | 0.75 | weekly | build time |
| Core conversion pages (booking, services, contact, vehicle-transport, storage-warehousing, track, franchise, about) | 0.85 | monthly | build time |
| Service detail pages | 0.8 | monthly | build time |
| Blog posts (345) | 0.65 | monthly | **real, per-post** — pulled from each post's own `updatedDate` (or `pubDate` if unset) |
| Blog index / pagination | 0.6 | weekly | build time |
| Privacy / Terms | 0.3 | yearly | build time |
| Anything unclassified | 0.5 | monthly | build time |

Blog `lastmod` values are read directly from each post's frontmatter at
build time (all 345 matched and mapped correctly in testing) — so editing
an existing post's `updatedDate` automatically updates its sitemap entry
on the next deploy, no manual step.

**What this doesn't and can't do:** submitting `sitemap-index.xml` to
Google Search Console is a one-time manual step in the GSC dashboard
(Sitemaps → Add a new sitemap → `sitemap-index.xml`) — no code change can
do that part. Once submitted, GSC re-reads it on its own crawl schedule;
the existing `auto-index.mjs` GitHub Action (pings `/api/index-notify` on
every push) is what triggers faster re-crawls between GSC's own visits.

---

## v10.7.25 — Top-10 Local-Intent Keyword Layer (340 city posts)

Added a second keyword layer to all 340 city-specific blog posts (excludes
the 5 root-level generic posts), grounded in researched high-intent local
search patterns for the packers-and-movers vertical in India: **near me,
best in [city], [city] charges/cost, house shifting services in [city],
local movers in [city], office relocation company in [city], affordable
in [city], [city] reviews, door-to-door in [city], verified/trusted in
[city]**. Existing keyword content (the original 20-keyword sets from the
1000-Prompt strategic doc) was left untouched — this is additive.

**How it was applied, per post:**
1. Each post's existing category (pricing, trust, checklist, interstate,
   office, localities, local-shifting, packing, settlement, vehicle,
   general) determined which 3–5 of the 10 intents are actually relevant
   — a pricing post gets charges/affordable/reviews first, a trust post
   gets verified/reviews/best, etc.
2. **Duplicate-check first:** if a post's existing content already
   contains a given intent's phrase (e.g. already says "best packers and
   movers in X" or "X reviews"), that intent is skipped for that post —
   no stuffing, no repeating what's already there.
3. Up to 3 non-duplicate, category-relevant intents were woven into one
   natural paragraph per post (not a bullet list), phrased using one of 3
   rotating sentence templates per intent (chosen deterministically per
   post so the same city+category combination is stable, but wording
   varies post-to-post — avoiding the duplicate-content risk of pasting
   identical boilerplate 340 times).
4. Inserted as a new paragraph directly before each post's closing
   phone-number CTA line, so it reads as a natural lead-in rather than a
   tacked-on block.

**Result:** 284 of 340 posts received a new paragraph; 56 already had
full coverage of their category's relevant intents in the original
content and were left unchanged (verified via the same duplicate-check).
All 345 posts re-validated after the edit — frontmatter parses clean,
zero structural errors.

**Methodology note:** "top 10 keywords per city" was implemented as
category-matched intent templates personalized with each city's real
name (340 cities/towns, matched via `cities.json` plus the renamed-city
aliases already used elsewhere in the codebase — Mysuru/Hubballi-
Dharwad/Mangaluru/Belagavi/Kalaburagi/Ballari/Vijayapura/Shivamogga/
Tumakuru/Hosapete), not 340 individual live keyword-volume lookups —
those aren't something this pass can verify per-city, and the site's
standing rule against fabricated data means this is disclosed rather
than presented as bespoke per-city search research.

---

## v10.7.24 — Meta Description Length Fix (80 posts)

- **Fixed:** 80 blog posts had `description` frontmatter running 161–237
  characters — past the ~155–160 char point where Google truncates SERP
  snippets mid-word. Independently audited (all 345 posts checked; the
  other 265 were already within range) and trimmed to ≤160 chars each,
  preserving the original meaning and keyword content — no new claims
  added, nothing invented. Where a description had an em-dash-separated
  local-colour clause, that clause was shortened or dropped first, keeping
  the keyword-bearing opening and the closing detail intact. All 345 posts
  re-validated: frontmatter parses clean, zero descriptions over 160 chars.
- Full re-audit alongside this fix, all clean and unchanged: JSON data
  files, redirects, robots.txt, JSON-LD generation, `reviews.json` honesty
  architecture, wa.me link encoding, address consistency across schema/
  footer/contact/about.
- Outstanding, not code-fixable: the non-www → www redirect still needs
  the one manual Cloudflare dashboard step noted in `_redirects`. Real
  reviews, social profile URLs, and a GST/Udyam number are still the
  gating items for the remaining "100%" SEO checklist items — same as
  noted in v10.7.14's audit.

---

## v10.7.23 — Blog Route Fix (Nested Slugs)

- **Fixed:** `src/pages/blog/[slug].astro` renamed to `[...slug].astro`.
  345 posts live in `src/content/blog/`, and 300+ of them sit in state
  subfolders (e.g. `andhra-pradesh/srikakulam-localities-moving-routes-guide.md`),
  so `post.id` for those posts contains a `/`. A single dynamic segment
  (`[slug]`) can only match one path segment and returns 404 for any slug
  with a slash in it — only the 5 root-level posts were actually reachable
  at `/blog/{slug}/`; every state-folder post's link from `/blog/` and the
  city pages was broken. The rest-parameter route (`[...slug]`) matches
  multi-segment paths, so nested slugs resolve correctly now.
  `getStaticPaths()` already returned `{ slug: post.id }`, and `/blog/`'s
  index links already build `/blog/${post.id}/` — both were already
  correct for the fix, so no other logic changed.
- **Fixed:** version-number drift — `package.json` (`10.7.21` → `10.7.23`),
  `wrangler.toml`, `public/_headers`, and `public/robots.txt` all still
  read `v10.7.21`, out of sync with this pass. All four now read
  `v10.7.23`.

---

## v10.7.18–v10.7.21 — Bug-Fix Pass + AP Service-Area Re-Verification

This range wasn't logged here as it happened (package.json still read
"10.7.20" and this file still stopped at v10.7.17, even though newer work
already existed in the codebase) — backfilled from evidence in the code
itself, then closed out with this audit's own fixes:

- **Data work already present (v10.7.20–v10.7.21):** `package.json`
  described a 10-city deep-verification pass (Visakhapatnam, Vijayawada,
  Guntur, Nellore, Kurnool, Coimbatore, Hyderabad, Rajahmundry, Tirupati,
  Kakinada). `all-100-cities.json`'s own `last_updated_note` records a
  further v10.7.21 pass that replaced weak "filler" locality names (added
  only to hit a 20-area count) with real Grama/Ward Sachivalayam-sourced
  names across all 20 Andhra Pradesh cities. Confidence tags were
  deliberately left unchanged — current breakdown is 18 verified / 18
  moderate / 64 low-confidence. Telangana, Tamil Nadu, Karnataka, and
  Kerala's 64 low-confidence cities are the next re-verification target.
- **Fixed this pass:** three `wa.me` links in `api/follow-up.ts` (booking
  confirmation, 4h/24h/72h reminder, and post-delivery review emails)
  interpolated `trackingId` into the WhatsApp `?text=` param without
  `encodeURIComponent`, unlike every other WhatsApp link in the codebase —
  harmless while tracking IDs stay `PH-XXXXXX`, but inconsistent with the
  encoding pattern used everywhere else. Now wrapped in
  `encodeURIComponent(...)` to match.
- **Fixed this pass:** version-number drift across `package.json`
  (`10.7.20` → `10.7.21`), `wrangler.toml`, `public/_headers`, and
  `public/robots.txt` (all still said `v10.7.16`) — none of these matched
  the actual latest work, or each other. All four now read `v10.7.21`.
- Everything else audited clean: all JSON data files valid; no orphaned
  imports; every `_redirects` city-target resolves to a real page; all 100
  cities have complete `cities.json` / `service-areas` / `nearby-towns`
  coverage with zero gaps; env vars used in code match `.env.example`
  exactly; Razorpay HMAC verification logic is correct; no duplicate route
  slugs, DOM ids, or scope-colliding declarations found in the two largest
  components (`BookingEngine.astro`, `AIVideoSurvey.astro`).

---

## v10.7.17 — Stale Comment Fix (Service-Area Coverage)

Two code comments (in `[city].astro` and `serviceAreaSlug.ts`) claimed
service-area locality data only covered 73–86 of 100 cities, and named 14
cities (Srikakulam, Bhimavaram, Secunderabad, Medak, Bhongir, Jangaon,
Kumbakonam, Wayanad, Ernakulam, Munnar, Varkala, Changanassery, Kolar,
Chitradurga) as having none. Verified against
`src/data/service-areas/all-100-cities.json` directly: all 14 already have
real locality data (3–10 areas each, confidence levels moderate/low, two
verified). Actual coverage is **100/100 cities** — the comments were
written before that data was filled in and never updated. No data or logic
changed; only the two comments were corrected to match reality.

---

## v10.7.16 — Unused-Dependency Cleanup

Full sweep for unnecessary files/data, as requested. One real finding:

**`@astrojs/mdx` was installed and registered but completely unused.**
`astro.config.mjs` imported it and included `mdx()` in the integrations
array, and `package.json` listed it as a dependency — but this project's
blog collection loader only globs `**/*.md` (`content.config.ts`), and
there isn't a single `.mdx` file anywhere in the repo. It added install
size and a build-time integration for zero functional benefit. Removed
from both `astro.config.mjs` and `package.json`.

**Everything else checked and found clean, not touched:**
- Every component in `src/components/` is imported and used at least once
  (checked all 19).
- `franchise.astro` is linked from `Header.astro` (desktop + mobile nav)
  and the sitemap-ping list in `admin/index-ping.astro` — not orphaned.
- `/api/chat` is called from `ChatBot.astro`; every other API route under
  `src/pages/api/` has a corresponding caller.
- No stray editor/OS files (`.DS_Store`, `Thumbs.db`, `*.swp`, `*~`) found.
- Every icon referenced in `manifest.webmanifest` (`favicon.svg`,
  `icon-32.png`, `icon-192.png`, `icon-512.png`) exists in `public/`, and
  vice versa — no orphaned icon files.
- `public/hero.svg` (the old v10.7.11 placeholder, marked "safe to delete
  later" in that release's notes) is already gone from this zip — nothing
  to remove there.
- `public/security.txt` + `public/.well-known/security.txt` look like a
  duplicate at first glance, but RFC 9116 recommends publishing at both
  paths for crawler compatibility — kept as-is, not a real duplicate.
- Every field in `cities.json` (`slug`, `name`, `state`, `stateName`,
  `pop`, `landmark`, `content_intro`, `popular_routes`, `faq_text`, `lat`,
  `lng`) is read somewhere in `[state]/[city].astro` — no dead data
  columns.
- Every other declared dependency (`astro`, `@astrojs/sitemap`,
  `@astrojs/cloudflare`, `@tailwindcss/vite`, `tailwindcss`,
  `@tailwindcss/typography`, `sharp`, `wrangler`, `@astrojs/check`,
  `typescript`) has real, active usage in the codebase.

---

## v10.7.15 — Detailed Cancellation & Refund Policy

**`terms.astro` Section 4 expanded from a one-line summary into a full,
plain-English cancellation and refund policy** — free unlimited
rescheduling (24hr notice), a 24-hour no-questions-asked full-refund
window after booking, the existing 7-day/3-day refund slabs kept but
written out clearly, a same-slab guarantee if PackersHub's own crew fails
to show, and a force-majeure credit-note clause. Anchored at
`#cancellation-refund-policy` so it can be deep-linked.

**`BookingEngine.astro` — cancellation policy now surfaced at the point of
payment, not just buried in `/terms/`.** A one-line reassurance
(rescheduling + 24hr refund window, linking to the full policy) now sits
directly under the Razorpay payment button, next to the existing UPI/Card/
Wallet methods line.

**Note for Rushi — numbers need a real business decision before this goes
live.** The specific refund percentages and day-thresholds (100% / 50% /
non-refundable slabs) were carried over unchanged from the previous
one-line version already in the repo — they were not re-verified against
your actual operating costs (crew/vehicle booking lead time, cancellation
losses). Confirm these match what you can actually honor before deploying,
same standard as pricing and reviews elsewhere in this codebase.

---

## v10.7.14 — 50-Agent SEO Checklist: real gaps closed in code

Follow-up to a 50-item "AI agents for SEO" checklist audit. Of the 11 items
flagged as real gaps, 3 were pure code fixes (shipped here) and the rest
need either live GSC/GA/GBP data or manual outreach work that can't be
fabricated — see `PackersHub_50AI_Agents_GapFix_Report.md` for the full
breakdown per item.

- **Module 41 (pagination):** `src/pages/blog/index.astro` replaced with
  `src/pages/blog/[...page].astro` using Astro's `paginate()`. Only 5 posts
  exist today so this renders identically to before, but `/blog/2/`,
  `/blog/3/`, etc. now generate automatically once posts pass 9, with
  `rel="prev"`/`rel="next"` wired into `SEOHead.astro`. No future rebuild
  needed.
- **Module 31 (author entity):** `SEOHead.astro`'s BlogPosting schema now
  supports an opt-in `Person` author entity via new `authorBio`/`authorUrl`/
  `authorImage` frontmatter fields (added to the `blog` collection schema in
  `content.config.ts`). Stays on the honest `Organization` fallback unless a
  post has a real named writer with a real bio — same no-fabrication rule as
  `reviews.json`.
- **Modules 44/46/48 (rank tracking, traffic-drop, forecast):**
  `/api/admin/seo-ops.ts` and `/admin/seo-ops.astro` gained two new manual-
  entry log types (`rank`, `traffic`) alongside the existing competitor/
  citation ones — same pattern, staff pastes what they saw in Search
  Console/GA4/a rank tool. The traffic log adds a plain linear-trend
  calculation once 3+ real months are logged (arithmetic on real numbers
  only, not a prediction model).
- **Module 42 (image SEO) — correction, not a gap:** the earlier audit's
  claim that "almost the whole site is missing alt text" was wrong — every
  `<img>`/`<Image>` in the codebase (Hero, blog cards, blog detail, AI
  survey thumbnails) already had `alt` set. The real reason city/service
  pages have few images is that no per-city photography exists yet
  (documented in `SEO_59_MODULES_AUDIT.md`'s original "no image sitemap"
  reasoning) — that's a content gap needing real photos, not a code bug.
- Modules 17, 33, 34, 35, 38 (log file analysis, link prospecting, outreach
  writing, toxic-link auditing, GBP optimization) are not fixable inside
  this repo — they need either server/CDN log access this static Cloudflare
  Pages deploy doesn't have, or live accounts (Search Console, Semrush,
  Google Business Profile) this zip can't reach. Practical starting
  templates for each are in the gap-fix report instead of fabricated code.

---

## v10.7.13 — Canonical Domain Fix + Deploy Files Restored

**Fixed a real www/non-www mismatch found during a code review of the merged
zip.** `astro.config.mjs` (`site:`), every SEO schema block in `SEOHead.astro`,
`robots.txt`'s Sitemap line, and `llms.txt` all treated
`https://www.packershub.in` as canonical — but `wrangler.toml`'s `SITE_URL`,
the AI voice agent's hardcoded URLs (`voice/respond.ts`, `voice/status.ts`),
and `follow-up-cron.ts`'s fallback all pointed at the non-www form instead.
That meant tracking links and lead-capture calls the voice agent sends to
customers used a different domain than the one every canonical tag and the
sitemap point at. All four now consistently use `www.packershub.in`. A note
was added to `public/_redirects` explaining that the non-www → www 301 itself
has to be set up in the Cloudflare dashboard (Rules → Redirect Rules),
since Pages' `_redirects` file can't match on hostname.

**`.env.example` was stale.** It was carried over from an older export and
didn't document 5 secrets the current codebase actually reads: `ADMIN_TOKEN`,
`GPS_ADMIN_TOKEN`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
`TWILIO_AUTH_TOKEN`. Added, with the same setup notes already present for
the other variables. Its `SITE_URL` default was also non-www — fixed to
match.

**`.github/workflows/auto-google-index.yml`, `.env.example`, `.gitignore`
restored** — present in an earlier zip but missing from this one (likely a
zip-export artifact that dropped dotfiles/dot-folders).

---

## v10.7.12 — Real Hero Photo

**`public/hero.jpg` added — owner-supplied photo, replacing the v10.7.11
placeholder SVG.** Source image cropped from a 1024×1024 square to the
4:3 box `Hero.astro`'s container expects (no stretching), resized to
1000×750, and re-compressed to a progressive JPEG (~110KB) so it doesn't
regress the LCP fix from v10.7.11. `Hero.astro` now points `src` at
`/hero.jpg`; `public/hero.svg` is left in the repo unreferenced as a
lightweight fallback asset, safe to delete later.

**Note for a future pass, not blocking:** the supplied photo shows a
generic unbranded white truck and a house style that doesn't read as
South Indian/Nellore — fine as a placeholder, but worth swapping for an
actual PackersHub-liveried truck/crew photo (or a shot in a recognisably
South Indian street setting) when one is available, for brand and
geographic consistency with the rest of the site.

---

## v10.7.11 — Hero LCP Fix + wrangler.toml Version Sync

**`public/hero.jpg` never existed — fixed with a real committed file.**
Since v10.6.5, `Hero.astro` referenced `/hero.jpg` for the homepage's LCP
element, but the file was never actually added to `public/`, so it 404'd
on every page load and silently fell back to an inline placeholder SVG
via `onerror`. That masked the problem instead of fixing it. This
release adds `public/hero.svg` — a branded illustration (truck + packed
boxes in brand colors), not a stock or AI-generated photo passed off as
a real fleet/team picture, consistent with this codebase's no-fabrication
rule — and points the `<img>` straight at it. The file genuinely exists
now, so there's no 404, no LCP failure, and the old `onerror` fallback +
`astro:page-load` re-check script (dead-code once the real file is
present) were removed. SVG is also a smaller payload than a JPG would
have been, so this is a straight Core Web Vitals win. **Still recommended:**
replace `public/hero.svg` with a real photo of your fleet/team when one
is available — swap the single `src="/hero.svg"` line in `Hero.astro`.

**`wrangler.toml` header was stale.** It still read "PackersHub v10.6.6"
after nine releases of work past that point — fixed to match the actual
project version. `TRACKING_KV`'s binding comment was also expanded with
the exact `wrangler kv namespace create` steps, since that one genuinely
cannot be completed from a zip file — it requires creating a real
namespace inside your own Cloudflare account. Left commented out
(unfilled) rather than seeded with a placeholder id, since a fake id
would silently point live order-tracking data at the wrong place instead
of failing safely. `/track/` and lead capture continue to work without
it — they skip the KV step gracefully — but tracking numbers won't
persist until this one manual step is done.

---

## v10.7.10 — Service Areas Coverage Complete: 100/100 Cities

**Medak filled in — the last gap.** Rushi supplied the locality names
directly from local knowledge: Mission Compound, Ram Nagar, AP Housing
Board Colony, Gangineni, Jambikunta, Chegunta Road. Tagged `confidence:
moderate` (owner-supplied, not independently cross-sourced like the
Wikipedia/directory-backed entries).

**Every one of the 100 city pages now renders the "Our Service Areas"
section.** Confidence breakdown across the full dataset: `verified`
(Secunderabad, Ernakulam, and the original 16 well-documented metros),
`moderate` (Kumbakonam, Wayanad, Munnar, Varkala, Medak, and 13 others),
`low` (the remaining tier-2/3 towns — Srikakulam, Bhimavaram,
Changanassery, Bhongir, Jangaon, Kolar, Chitradurga, and 64 others from
the original dataset). `<ServiceAreas>` doesn't currently surface this
confidence tier to site visitors — see the v10.7.7 entry above if that's
worth exposing later.

---

## v10.7.9 — Service Areas Coverage Extended to 99/100 Cities

**Added 4 more towns via municipal directory research:** Bhongir and
Jangaon (Telangana), Kolar and Chitradurga (Karnataka). Since these
tier-3 towns have no Wikipedia-level locality coverage, sourced instead
from municipal ward-boundary notifications (which name real colonies at
each ward's boundary description, e.g. Bhongir Ward 32: "Hussainabad
Village") and real-estate directories (99acres locality/project listings
for Kolar). All 4 are tagged `confidence: low` — thinner sourcing than
the v10.7.8 batch, worth a local sanity-check.

- **Bhongir:** Hussainabad, Hanuman Nagar, R.B. Nagar, Indra Nagar,
  Tarakarama Nagar (from the 35-ward municipal boundary notification).
- **Jangaon:** Rajeev Nagar Colony, Yeshwanthapur, Hanamkonda Road (from
  the 30-ward municipal boundary notification — thinner than the other 3,
  only 3 areas found).
- **Kolar:** Tamaka, Bavanahalli, Parasepalli, Kamandahalli, Kolar Gold
  Fields (from 99acres locality/project listings).
- **Chitradurga:** V.P. Extension, CK Puram, Municipal Colony, Kelagote,
  Teachers Colony/Jogimatti Road (from a Karnataka State Bar Council
  address directory listing advocates' registered addresses in the city).

**Medak is the sole remaining gap — still genuinely no data.** Dedicated
searches across Wikipedia, municipal records, and real-estate directories
turned up only rural mandal villages and an unrelated "Ambedkar Colony"
64km away in a different Medak-district town (Ramchandrapuram/Patancheru,
not Medak town itself). No named locality inside Medak town surfaced
anywhere searchable. Rather than substitute a nearby-but-wrong result or
invent one, Medak's entry was left out — its page renders without the
Service Areas section, same as before v10.7.7.

**Net coverage: 99 of 100 city pages** (up from 95/100 in v10.7.8).

---

## v10.7.8 — Service Areas Coverage Extended to 95/100 Cities

**Researched and added locality data for 9 of the 14 previously-uncovered
cities:** Srikakulam, Bhimavaram (Andhra Pradesh); Secunderabad
(Telangana); Kumbakonam (Tamil Nadu); Wayanad, Ernakulam, Munnar, Varkala,
Changanassery (Kerala). Sourced from Wikipedia, municipality/district
government pages, and tourism sources — Secunderabad and Ernakulam are
tagged `verified` (well-documented major localities), Kumbakonam / Wayanad
/ Munnar / Varkala are `moderate`, and the two Andhra towns plus
Changanassery are `low` confidence (thinner source coverage — worth a
local sanity-check before treating as final).

**5 towns intentionally left without a Service Areas section: Medak,
Bhongir, Jangaon, Kolar, Chitradurga.** No reliably documented
locality/colony-level data could be found online for these towns even
after dedicated research — they're small tier-3 towns without the
Wikipedia/municipal-map coverage the others have. Rather than inventing
plausible-sounding colony names, no entry was added for them, so
`<ServiceAreas>`'s existing no-op guard keeps their pages exactly as they
were before v10.7.7 — no section, no placeholder, no fabricated content.
If real locality names for these 5 are available locally, they can be
added the same way (`name` + `category`: `affluent` / `commercial` /
`high-population`) in `src/data/service-areas/all-100-cities.json`.

**Net coverage: 95 of 100 city pages** now render the section (up from
73/100 in v10.7.7), accounting for the existing 13-city slug-alias map.

---

## v10.7.7 — Locality-Level Service Areas Section

**New: `<ServiceAreas>` component + `src/data/service-areas/all-100-cities.json`.**
Every city page (`[state]/[city].astro`) now renders an "Our Service Areas
in {city}" section listing real named localities within that city
(premium residential / commercial hub / high-density residential, tagged
and colour-coded), wrapped in `ItemList`/`ListItem` microdata. Sits between
the city guide section and the "What Affects Your Price" block.

**Coverage: 73 of 100 cities, honestly.** The areas dataset was researched
independently of `cities.json` and only has entries for 73 of the 100
cities currently live on the site — the remaining ~14 (Srikakulam,
Bhimavaram, Secunderabad, Medak, Bhongir, Jangaon, Kumbakonam, Wayanad,
Ernakulam, Munnar, Varkala, Changanassery, Kolar, Chitradurga) have no
locality data yet. `<ServiceAreas>` already no-ops cleanly when a city
isn't found, so those pages simply skip the section rather than showing
anything fabricated — no placeholder or generic filler content.

**New: `src/utils/serviceAreaSlug.ts`.** 13 Karnataka/Tamil Nadu/Kerala
cities use different slugs across the two datasets — `cities.json` has the
older common name (`bangalore`, `mysore`, `hubli`, `mangalore`, `belgaum`,
`gulbarga`, `bellary`, `bijapur`, `shimoga`, `tumkur`, `hospet`,
`udhagamandalam`, `idukki`), the areas file has the official/current name
(`bengaluru`, `mysuru`, `hubballi-dharwad`, `mangaluru`, `belagavi`,
`kalaburagi`, `ballari`, `vijayapura`, `shivamogga`, `tumakuru`,
`hosapete`, `ooty`, `thodupuzha`). A small alias map resolves these so
those 13 cities' sections render correctly instead of silently
disappearing.

**Confidence data not yet surfaced.** The dataset tags each city
`verified` / `moderate` / `low` per its own sourcing confidence (16 / 13 /
71 split — see the dataset's `note` field), but `<ServiceAreas>` doesn't
currently display this to visitors. Per the dataset's own note, low/
moderate-confidence tier-2/3 town entries should be spot-checked locally
before being treated as fully reliable.

---

## v10.7.6 — Trailing-Slash Canonicalization + Integration Status Panel

**Fix 1: trailing-slash inconsistency (open SEO issue, flagged in the
competitor-comparison audit).** `astro.config.mjs` now sets
`trailingSlash: 'always'` explicitly instead of relying on Astro's default.
Every internal `href`, `canonical` tag, and schema `url`/`item`/`@id` field
across the codebase (Header, Footer, CitiesGrid, `[city].astro`,
`[state]/index.astro`, `[service].astro`, and all static top-level pages)
now consistently emits the trailing-slash form, so
`/andhra-pradesh/nellore/` is the one true canonical URL instead of two
competing forms. `public/_redirects` gained a scoped safety-net (known
static pages + 5 state slugs + 9 service slugs + `/{state}/{city}` pattern
only — deliberately not a generic wildcard, so real files like `/llms.txt`
or `/.well-known/security.txt` can never be caught by it) to 301 any
external/legacy link still pointing at the old non-slash form.

**Re: AggregateRating schema — audited, not changed.** `Testimonials.astro`
already gates all Review/AggregateRating schema behind
`realReviews.length >= 5`; below that it renders the honest illustrative
mode with no schema at all. `reviews.json` shipping empty is a *content*
gap (see `REVIEWS_README.md` for how to add real reviews), not a schema
bug — there was nothing broken here to fix.

**Fix 2: env var visibility.** `src/env.d.ts`'s `Cloudflare.Env` interface
was missing 5 vars that live API routes already read via `env?.X`
(`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `TWILIO_AUTH_TOKEN`,
`AUTO_INDEX_TOKEN`, `GPS_ADMIN_TOKEN`) — added, so TypeScript can now catch
typos against these. Also removed the unused `GA4_ID` entry (nothing ever
read it; `Analytics.astro` has only ever read
`import.meta.env.PUBLIC_GA_MEASUREMENT_ID`) and added a proper
`ImportMetaEnv` type for that var instead. `.env.example` gained entries
for `PUBLIC_GA_MEASUREMENT_ID`, `RAZORPAY_KEY_ID/SECRET`,
`TWILIO_AUTH_TOKEN`, `GPS_ADMIN_TOKEN`, `ADMIN_TOKEN`, and a note on
`TRACKING_KV` (a KV binding, not a settable secret) — none of these were
documented there before, which was part of why they went unset silently.

**New: `/admin/integrations/`** — a staff-only panel (same `x-admin-token`
gate as `/admin/orders/` and `/admin/seo-ops/`, via a new
`/api/admin/integrations.ts` endpoint) showing which of the ~20 integration
env vars are configured vs missing, grouped by feature, with which ones are
silently-degrading-optional vs will-break-something-required flagged
separately. Never renders an actual secret value, and — unlike a first
draft of this page — the status data is fetched client-side after token
auth, not rendered server-side before it, so the missing/configured
booleans themselves stay behind the same gate as everything else in
`/admin/`.

---

## v10.7.5 — Fake Pricing Removed from Services Page Schema

**Fix: `services.astro`'s `servicesSchema` (`Service` blocks for Household
Shifting, Office Relocation, Vehicle Transport) previously published
hardcoded `offers.price` values (₹3,500 / ₹12,000 / ₹2,500) with no real
source.** These were the exact class of unverified fixed rupee figure the
project already refuses to publish elsewhere (see Modules 05-07 in
`SEO_59_MODULES_AUDIT.md`) — just missed in this one file. Removed; the
`Service` entries now carry no price claim, matching every other Service
schema in this codebase (`[service].astro`, `[state]/[city].astro`).
Re-add only with a real, current, business-confirmed price.


## v10.7.4 — Modules 31-40 & 53: Dedicated Service Pages

**New: 9 dedicated service pages** (`src/data/services.json` +
`src/pages/[service].astro`) closing out the remaining items from the
59-module SEO doc that needed real code, not process/documentation —
see `SEO_59_MODULES_AUDIT.md` for the full module-by-module status.

- `/home-shifting-services`, `/office-relocation-services`,
  `/car-transportation`, `/bike-transportation`,
  `/international-relocation`, `/local-shifting`, `/intercity-shifting`,
  `/industrial-shifting`, `/packing-services`
- Each page: unique definition, a real 4-step process, service-specific
  FAQs with FAQPage schema, Service schema (no fabricated price — same
  no-fabrication standard as the rest of this codebase), and links to
  all 5 state hub pages.
- `/warehouse-storage` (Module 35's URL) 301-redirects to the existing,
  already-indexed `/storage-warehousing` page instead of publishing a
  duplicate — see `public/_redirects`.
- `services.astro` now links out to all 11 detailed service pages
  (Module 53 — service-cluster interlinking), and each service page
  cross-links 3 related services plus back to `/services`.
- All 9 new URLs are picked up automatically by the existing
  `@astrojs/sitemap` integration — no manual sitemap edit needed.

## v10.7 — Automatic Google Indexing on Every Push

**New: `.github/workflows/auto-google-index.yml`.** Every push to `main`
now automatically notifies Google after the Cloudflare Pages build goes
live — no more remembering to open `/admin/index-ping/` after an edit.
Workflow waits ~100s for the deploy, then runs `scripts/auto-index.mjs`,
which diffs the push and calls the existing `/api/index-notify` endpoint:

- A single static page file changes (e.g. `src/pages/about.astro`,
  a `src/content/blog/*.md` post) → that exact URL gets a direct
  Indexing API call (`URL_UPDATED`).
- Site-wide files change (components, layouts, global CSS, `cities.json`,
  `states.json`, the `[state]/[city].astro` template) → too many pages
  to enumerate one by one, so a sitemap ping is sent instead (unlimited
  quota, covers everything).
- A sitemap ping (Google + Bing) is sent on **every** push regardless,
  as a cheap catch-all.

**New: optional `AUTO_INDEX_TOKEN`.** `/api/index-notify` now accepts an
`X-Auto-Index-Token` header. If `AUTO_INDEX_TOKEN` is set as a Cloudflare
Pages env var, the endpoint requires a matching header on every request —
set the same value as a GitHub Actions repo secret to keep the workflow
working, and paste it once into the `/admin/index-ping/` panel (saved to
this device's `localStorage`). Leaving `AUTO_INDEX_TOKEN` unset keeps the
endpoint open, exactly like before — fully backward compatible.

**Setup (one-time, mobile-friendly — no terminal needed):**
1. Nothing required to get basic auto-indexing working — it just runs.
2. *Optional hardening:* GitHub repo → Settings → Secrets and variables →
   Actions → New repository secret → `AUTO_INDEX_TOKEN` = any random
   string. Set the *same* string in Cloudflare Pages → Settings →
   Environment variables → `AUTO_INDEX_TOKEN`. Then open
   `/admin/index-ping/` once and paste that string into the new
   "Auto-Index Token" field.

---

## v10.6.6 — Env Wiring, Unique City Content, Image Optimization, Blog Bylines

Six fixes from the latest audit round.

**1. Review-automation env vars were undocumented — `.env.example` added.**
`GOOGLE_REVIEW_URL` and `CRON_SECRET` were referenced in code
(`follow-up.ts`, `follow-up-cron.ts`) but never listed anywhere a deployer
would actually find them. New `.env.example` at the repo root documents
every env var the codebase reads, which ones are required vs optional, and
exactly what each one does. `wrangler.toml` now has a `[vars]` section for
non-secret values plus a comment block with the exact `wrangler pages
secret put` commands needed. `src/env.d.ts`'s `Cloudflare.Env` interface
was also missing most of these vars (`GOOGLE_REVIEW_URL`, `CRON_SECRET`,
`MSG91_*`, `WABA_*`, `GOOGLE_SA_*`, `TEAM_PHONE`, `SITE_URL`) — added so
TypeScript actually catches typos against the real binding names.

**2. 21 city pages had generic, templated `content_intro` body copy.**
Flagged in v10.6.5 but not fixed there. Nandyal, Hindupur, Proddatur,
Secunderabad, Mancherial, Medak, Bhongir, Vikarabad, Sivakasi, Karur,
Hosur, Nagercoil, Kumbakonam, Hospet, Hassan, Mandya, Ernakulam, Munnar,
Varkala, Guruvayur, and Changanassery all had a reused "coastal plains
rising into the Eastern Ghats" paragraph that was geographically wrong for
most of them (e.g. applied to inland Deccan-plateau towns and Western
Ghats hill stations alike). All 21 were rewritten with city-specific
geography, climate, local industry, neighbourhoods, and landmarks —
Hampi for Hospet, the Belur/Halebidu Hoysala temples for Hassan, the
Munnar tea-estate ghat roads, Sivakasi's fireworks/matchbox industry,
Secunderabad's railway-cantonment history, and so on — matching the depth
and accuracy already present in Vijayawada's intro and each city's
`faq_text`.

**3. `astro:assets` was configured but never used — blog images were
unoptimized static files.** `astro.config.mjs` already had `image.service:
sharp` set up, but every `<img>` tag served files straight from `public/`
with no resizing or format conversion. The 5 real blog post photos moved
from `public/blog/` to `src/assets/blog/`, the blog content collection
schema now uses Astro's `image()` helper (`content.config.ts`), and
`blog/index.astro` + `blog/[slug].astro` render them through `<Image />`
instead of `<img>`. `AIVideoSurvey.astro`'s thumbnail `<img>` was left
alone — it's a runtime client-side preview of a user's uploaded blob URL,
which `astro:assets` (a build-time-only optimizer) can't touch.

**4. Blog posts all had the identical byline "PackersHub Team."** Each
post's `author` frontmatter now names the specific internal team that
actually covers that topic (Packing & Logistics Desk, Interstate
Operations Desk, Customer Success Desk, Commercial Relocation Desk,
Hyderabad Operations Desk) instead of one blanket label. A `BlogPosting`
JSON-LD schema is now emitted on article pages (there was none before),
with `author` typed as an `Organization` — deliberately not a fabricated
named individual with invented credentials, since no real bylined
journalist exists for these posts; inventing one would violate the
project's standing no-fabrication rule. `SEOHead.astro`'s
`citation_author` meta tag was also hardcoded to `"PackersHub"` regardless
of the actual `author` prop passed in — now reads the real value. Each
post page also got a short, honest author-context box (team name + what
PackersHub's operations team actually does) instead of no attribution
context at all.

**5. `admin/index-ping.astro` had no `noindex` meta tag.** It's a staff-only
tool already blocked by `Disallow: /admin/` in `robots.txt`, but that's a
single point of failure — a misconfigured CDN rule or a crawler that
ignores robots.txt would index it. Added `<meta name="robots"
content="noindex, nofollow">` directly to the page head as defense in
depth, matching how `admin/orders.astro` already protects itself via
`BaseLayout`'s `noindex` prop.

**6. `public/hero.jpg` is still a missing file.** Not fixed in this round —
deliberately. The SVG fallback added in v10.6.5 still renders correctly
with zero broken-image flicker, but an actual photo of PackersHub's crews
or trucks has to come from the business; it can't be fabricated or sourced
from a generic stock photo without misrepresenting the company. Drop a
real photo at `public/hero.jpg` (1200×900 or similar 4:3 ratio) to replace
the fallback — no code changes needed on that side.

```bash
npm run build
wrangler pages deploy dist
```

---

## v10.6.5 — Stale Version Strings, Dead FAQ Data Wired In, Honest Review Infrastructure

Three fixes from the latest audit round.

**1. Version/date drift across the repo.** `privacy.astro` and `terms.astro`
still said "Last updated: January 1, 2025"; `llms.txt` said "Version: 10.1.0";
`robots.txt` and `_headers` both said "v10.1.0" / "v10.0.0"; `package.json`
was stuck at `10.6.3`. All now read `10.6.5` / `2026-06-30` consistently.
This has been flagged in every audit since v10.1 — the underlying problem
is that these are hand-edited literals with no single source of truth, so
it will recur again next release unless that's addressed structurally.

**2. `city.faq_text` was dead data for all 100 cities, not just the 22
that were empty.** `src/utils/parseFaq.ts` (new) parses the existing
"Q? A. Q? A. Q? A." prose format into structured `{q, a}` pairs (validated
clean against all 100 cities — every entry has exactly 3 question marks).
`FAQ.astro` now accepts a `localFaqs` prop and merges it into both the
visible accordion and the FAQPage JSON-LD, right after the cost question.
`[state]/[city].astro` parses `city.faq_text` and passes it in, and the
old hardcoded duplicate FAQPage block (3 generic questions, identical
across all 100 city pages) has been removed from `citySchema` — there is
now exactly one FAQPage schema per city page, and it's genuinely unique.
The 22 cities that had empty `faq_text` (Vijayawada, Nandyal, Hindupur,
Proddatur, Secunderabad, Mancherial, Medak, Bhongir, Vikarabad, Sivakasi,
Karur, Hosur, Nagercoil, Kumbakonam, Hospet, Hassan, Mandya, Ernakulam,
Munnar, Varkala, Guruvayur, Changanassery) now have 3 real Q&A pairs each.

**3. Review/AggregateRating infrastructure — ships empty, on purpose.**
`src/data/reviews.json` is a new empty array. `Testimonials.astro` now
reads it: below 5 entries it stays in the same honest "illustrative
examples" mode as the v9.1.1 fix (no Review schema emitted); at 5+ real
entries it automatically computes and publishes real Review +
AggregateRating schema from whatever is actually in the file. No
placeholder names, quotes, or ratings were added — per the project's
standing no-fabricated-reviews rule, that data has to come from the
business owner's actual Google Business Profile. See
`src/data/REVIEWS_README.md` for the exact format and process.

**Not fixed in this release, flagged for next round:** `public/hero.jpg`
is still a missing file (SVG fallback only, added in the prior release) —
needs an actual photo supplied by the business, not something that can be
fabricated; no `astro:assets` Image optimization pipeline is in use yet
for city/blog images; 21 of the 22 cities that just received FAQ content
still have generic, templated `content_intro` body copy (only Vijayawada's
is unique) — a separate, larger content-writing task from the FAQ fix
done here.

```bash
npm run build
wrangler pages deploy dist
```

---

## v10.6.4 — Nearby Cities: Real Geo-Distance Fix

`src/utils/nearbyCities.ts` contained a working Haversine distance function
(`getNearbyCities()`) but it was never imported anywhere — `[state]/[city].astro`
instead used `cities.filter(c => c.state === city.state).slice(0, 8)`, which
ignored every city's real lat/lng and just grabbed the first 8 same-state
entries regardless of actual distance.

**Fixed:** `[city].astro` now imports and uses `getNearbyCities(city, cities, 8, 200)`
— real Haversine distance across all 100 cities, with a same-state fallback
built into the util for any city missing coordinates. Border-area cities
(e.g. Nellore ↔ Chennai/Kanchipuram, ~150km away) can now correctly surface
a genuinely closer city in a neighbouring state instead of a farther one in
the same state. Heading copy updated from "Also Serving Nearby Cities in
{state}" to "Also Serving Nearby Cities" since results can now legitimately
span a state border (each card still shows its own state name).

**File changed:** `src/pages/[state]/[city].astro`
**`package.json`** version corrected from stale `10.1.0` → `10.6.3`.

No new dependencies, no new secrets, no KV/schema changes.

```bash
npm run build
wrangler pages deploy dist
```

---

## v10.6.3 — Install Prompt, Driver GPS Self-Report, Full Payment Option, Review Automation

Four improvements from the competitive scoring review, plus one structural
bug fix surfaced while building Fix 3. The existing 20%-advance flow is
unchanged — Fix 3 only adds a second, customer-chosen option alongside it.

**1. PWA "Install App" prompt** — `InstallPrompt.astro` (new), `BaseLayout.astro`.
The manifest/service worker/icons were already fully wired but had no
visible install trigger. Adds a dismissible banner on `beforeinstallprompt`
(Android/desktop Chrome); remembers dismissal for 14 days, not forever. No
`beforeinstallprompt` on iOS Safari → banner simply never shows there, no
broken behavior.

**2. Driver self-report GPS (no app, no curl)** — `gps/driver-update.ts` (new),
`driver/[id].astro` (new), `admin/orders.astro`, `robots.txt`. Staff click
"Generate Driver Link" in `/admin/orders/`; the link's token is a per-booking
`HMAC-SHA256(trackingId, GPS_ADMIN_TOKEN)` computed client-side, so the
master token is never shared with the driver. The link opens a no-login page
with "Share Current Location" / "Start Live Sharing" (auto-push every
2 minutes). `/api/gps/driver-update` independently recomputes the same HMAC
server-side — a leaked driver link can only ever push GPS for that one
booking. Coordinates sanity-checked against India's bounding box. `/driver/`
added to `robots.txt` disallow list. The existing staff/master-token
endpoint (`/api/gps/update`) is untouched.

**3. "Pay Full Amount" option alongside the 20% advance** — `RazorpayCheckout.astro`,
`BookingEngine.astro`, `payment/verify.ts`, `track.ts`, `track/index.astro`,
`admin/orders.astro`. A toggle now sits above the payment button: "Pay 20%
Advance" (still default) or "Pay Full Amount". `create-order.ts` already
accepted any `advancePct` 1–100, so no server change was needed there;
`payment/verify.ts` now accepts `isFullPayment` and stores
`paymentType: 'advance' | 'full'`, which flows through to the `/track/`
badge, the admin payment chip, and both confirmation emails.

*Bug found and fixed while building this:* `RazorpayCheckout.astro` rendered
its own copy of `#rzp-payment-block` with the same element IDs as the copy
already inside `BookingEngine.astro` (both mounted on `/booking`) — duplicate
DOM IDs that "worked" only because `getElementById` grabs the first match,
leaving RazorpayCheckout's own markup dead and never shown. Fixed properly:
`RazorpayCheckout.astro` is now script-only (defines `window.phInitRazorpay`,
renders no DOM); BookingEngine's markup is the single canonical instance.
Verified zero duplicate IDs (86 IDs checked) and every `getElementById()`
call resolves to a real element.

**4. Automated post-delivery review request** — `follow-up.ts`,
`follow-up-cron.ts`, `admin/order.ts`. Marking a booking "Delivered" seeds a
`review:<trackingId>` KV entry with `deliveredAt`. The existing 5-minute cron
scan now also scans `review:` keys, and 4 hours after delivery fires a
Google-review-request email (`GOOGLE_REVIEW_URL` secret), with a note to
contact support first if anything wasn't perfect — so unhappy customers are
routed to support before a public review. Only fires for staff-confirmed
deliveries; sent at most once per booking (`requested` flag).

**New secret:** `GOOGLE_REVIEW_URL` (optional — review step no-ops without it,
logged as `skipped_no_review_url`).

**Verification performed:** all 7 touched/new TypeScript API files
type-checked clean (`tsc --noEmit`, stubbed CF env); all modified inline
`<script>` blocks passed `node --check`; zero duplicate HTML IDs across
`BookingEngine.astro` + `RazorpayCheckout.astro`; every `getElementById()`
resolves; HTML tag balance checked on `admin/orders.astro` + `driver/[id].astro`.

No new KV namespace, no `wrangler.toml` binding changes.

---

## v10.6.2 — Admin Dashboard: Payment + GPS Visibility

Closes the gap flagged in the v10.6.1 audit: staff had no way to see payment
or GPS status from `/admin/orders/`, or push a GPS point without `curl`. No
backend changes needed — `/api/admin/order` already returned the full KV
record (`paymentStatus`, `paidAt`, `gpsLatest`, `gpsHistory`). Only the
staff-facing display changed.

**File changed:** `src/pages/admin/orders.astro` only.

- **Payment status chip** under the customer name: "✅ Advance Paid (3 hr
  ago)" or "⏳ Advance Not Paid", read from existing fields.
- **GPS Tracking card**: last position (lat/lng, time ago, note, ETA,
  vehicle no., speed), or "No GPS data pushed yet"; shows breadcrumb point
  count.
- **Push GPS Update form** directly from the dashboard (lat, lng, note, ETA,
  vehicle no.) — calls the existing `/api/gps/update` endpoint from the
  browser, so any staff member with the GPS token can push a point, not just
  a developer with `curl`. `GPS_ADMIN_TOKEN` is a separate, collapsed field
  from the staff `ADMIN_TOKEN` (different Cloudflare secrets); remembered on
  device via `localStorage` like the staff token. Fields pre-fill from the
  last known point.
- Status-update flow now refreshes both the payment chip and GPS card from
  the server-confirmed record, not just the result text.

**Not changed / explicitly out of scope:** no new auth model (still shared
secret); no map preview in admin (kept on `/track/` only, to stay light on a
phone screen); no GPS history table in admin (full breadcrumb stays on
`/track/`).

---

## v10.6.1 — Bug Audit & Fixes

Full audit of v10.6 (Payment + GPS): every API/lib/util file type-checked
with `tsc --noEmit` against a stubbed Cloudflare Workers env, plus manual
review. 4 real bugs fixed, 1 honesty-rule violation (fabricated stat) fixed.
No new dependencies, no breaking changes.

1. **Track page milestone timeline was wrong.** A single linear `STAGES`
   array + `status` decided checkmarks, but "Advance Paid" is set the moment
   a customer pays — almost always before any staff milestone update — and a
   customer can also skip paying while staff move milestones forward
   anyway. This caused false checkmarks both ways (paid-too-early showing
   later stages done; skipped-payment showing "Advance Paid" done). **Fix:**
   reordered `STAGES` to put Advance Paid right after Booking Received, and
   decoupled its checkmark from sequence position — it now checks the
   timeline for a real "Advance Paid" entry, same as the payment badge.

2. **Razorpay phone prefill missing "+91".**
   `phone.replace(/\D/g,'').replace(/^0/,'+91')` only added `+91` if the
   cleaned number happened to start with a literal `0` — almost never true
   for a 10-digit Indian mobile number, so the result usually had no `+` at
   all. **Fix:** strip non-digits, keep the last 10 digits, always prefix
   `+91`.

3. **Race condition could fail payment with "Booking not found."**
   `phInitRazorpay()` fired immediately after (not awaiting) `/api/lead`,
   using the client-generated `trackingId` — but `create-order` requires the
   booking to already exist in KV. **Fix:** now waits for `/api/lead`'s
   response and only initializes Razorpay once the server confirms the
   record was stored, using the server-confirmed `trackingId`. WhatsApp send
   still fires instantly, unblocked.

4. **`buildFollowUpEmail` return type lied about its shape** — declared
   `: string`, actually returned `{ subject, html }`; every call site
   silenced the resulting type error with an `as` cast instead of fixing it.
   **Fix:** corrected the type annotation, removed the 3 now-unnecessary
   casts.

5. **Fabricated/inconsistent "item types" stat.** Marketing copy said
   "300+" in one place, "288+" in another; the real `ITEM_DB` had 284
   entries — both numbers overstated it. **Fix:** corrected to "280+"
   everywhere (true since 284 ≥ 280), per the project's no-fabricated-stats
   rule.

**Verified clean, no changes needed:** the lat/lng-defaulting-to-Nellore bug
(already fixed; all 100 cities confirmed unique coordinates); no fabricated
trust stats (4.9★ / 2,847 reviews / 15,000+ moves) anywhere; zero TypeScript
errors across `api/**`, `lib/**`, `utils/**`; zero duplicate element IDs
sitewide; `cities.json`/`states.json`/blog frontmatter all validate against
their Zod schemas.

**Known gaps flagged (not bugs):** `admin/orders.astro` didn't yet show
payment/GPS status (closed in v10.6.2, above). Inline `<script>` blocks
across several `.astro` files have pre-existing TS-strictness gaps
(`getElementById()` returns generic `HTMLElement`) — cosmetic for `astro
check` only, doesn't affect runtime, predates v10.6, left alone as a large
low-value/higher-risk sweep.

---

## v10.6 — Razorpay Payment Gateway + Live GPS Tracking

Two major features on top of v10.5. Zero new npm dependencies.

**Feature 1 — Razorpay 20% advance payment.** Customer flow: fill Booking
Engine → "Send Booking via WhatsApp" → success panel shows Tracking ID → a
"Pay ₹X Advance" block appears → Razorpay checkout (UPI/Net
Banking/Card/Wallets) → server verifies HMAC-SHA256 signature (native Web
Crypto, no SDK) → booking status updates to "Advance Paid" in KV → team gets
a "Payment Received" email.
New: `api/payment/create-order.ts`, `api/payment/verify.ts`,
`RazorpayCheckout.astro`. Modified: `BookingEngine.astro`, `booking.astro`,
`track/index.astro` (Advance Paid timeline stage + badge).
**Secrets:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. Advance % configurable
via `advancePct` in `create-order.ts` (default 20%). Payment only initiates
if `trackingId` already exists in KV (no orphan orders).

**Feature 2 — Live GPS truck tracking.** While a booking is "In Transit",
team can push GPS coordinates (WhatsApp bot / admin panel / `curl`) to
`POST /api/gps/update` (Bearer `GPS_ADMIN_TOKEN`). `/track/` then shows a
live Leaflet.js + OpenStreetMap map: truck marker, orange breadcrumb
polyline (up to 50 stored points), source/destination city markers,
auto-refresh every 60s. No map before GPS is pushed; full milestone timeline
otherwise. New: `api/gps/update.ts`, `api/gps/status.ts`. GPS data lives
inside the existing booking record in `TRACKING_KV` (`gpsLatest`,
`gpsHistory`) — no new namespace. If GPS is pushed while status is "Packing
Crew Assigned," it auto-advances to "In Transit."
**Secret:** `GPS_ADMIN_TOKEN`.

---

## v10.5 — Fix Notes

**Fix 1 — AIVideoSurvey scoped to booking page only.** It had been imported
on all 100 city landing pages (~40KB extra JS per page, irrelevant to
city-level SEO content). Added a `bookingOnly` prop guard
(`if (!bookingOnly) return;`) so it only renders where explicitly passed
`bookingOnly={true}` — i.e. `booking.astro`. Also added `fromCity`/`toCity`
props so the booking page can pre-fill the route from query params.

**Fix 2 — ITEM_DB expanded 31 → 288 items**, across 16 categories (sofas,
beds, wardrobes, kitchen/dining furniture, TVs/AV, fridges, washing
machines, AC, fans, large kitchen appliances, plumbing, electronics,
bathroom, fitness, outdoor, kids' items, décor, boxes). Every item has a
real cubic-foot `volume`, a `packingMultiplier` for fragile items (e.g. 2.0×
for mirrors), and a correct category tag. Added a "Tata Ace Mini (6 ft)"
truck tier for small sub-80-cu.ft moves (6 tiers total). UI badge corrected
to "300+ item types" (later re-corrected to "280+" in v10.6.1 once the true
count settled at 284).

---

## v10.4 — AI Phone Agent (24/7 Inbound Calls)

Adds a real AI voice receptionist for the business number, alongside (not
replacing) the text chatbot. Caller picks English / Telugu / Hindi / Tamil /
Kannada / Malayalam by keypad, then talks naturally; Claude handles the
conversation; a qualified enquiry saves as a lead through the same
`/api/lead` pipeline (KV tracking + email + WhatsApp/SMS follow-up).

**New files:** `lib/voiceAgent.ts` (shared engine — languages, TwiML
helpers, KV call-state, Twilio signature check, Claude call),
`api/voice/incoming.ts` (welcome + language menu), `api/voice/language.ts`
(keypad choice → starts conversation), `api/voice/respond.ts` (the
per-utterance conversation loop), `api/voice/status.ts` (call-end safety net
so no enquiry is silently lost). Zero new npm packages — Twilio signature
check uses native Web Crypto, not the `twilio` SDK.

**Call flow:** incoming → bilingual welcome + language menu →
`language.ts` greets in that language, opens speech `<Gather>` →
`respond.ts` runs per utterance: sends transcript to `claude-sonnet-4-6`,
speaks the reply in the caller's language/voice, then keeps listening,
transfers to `TEAM_PHONE`, or says goodbye. As soon as name + phone +
from-city + to-city are known, it fires `/api/lead` immediately, without
waiting for the call to end. `status.ts` cleans up on call end, or logs the
caller's number + partial transcript if the call dropped early — no
enquiry disappears.

**Guardrails:** only speaks the caller's chosen language; replies kept to
1–3 sentences (written for speech); will **not** invent a specific price or
claim real-time GPS tracking (same honesty standard as the city pages) —
offers the Tracking ID / `/track/` page instead; transfers to a human on
request, distress, an existing-booking complaint, or a stalled conversation;
caps a call at 8 AI turns then promises a callback.

**Required setup:** an inbound number on a webhook-capable platform (Twilio
used here; Exotel/Ozonetel portable on request) → Twilio Console: "A call
comes in" → `POST /api/voice/incoming`, "Call status changes" →
`POST /api/voice/status`. Reuses `TRACKING_KV` (call state auto-expires in
30 min). **Secrets:** `ANTHROPIC_API_KEY` (already required for the chatbot),
`TWILIO_AUTH_TOKEN` (recommended before launch — without it, anyone who
finds the webhook URL could POST fake call data), `TEAM_PHONE` (defaults to
+917731074075 if unset). TTS voice IDs in `voiceAgent.ts` should be checked
against Twilio's current Console list before go-live.

---

## v10.3 — AI Features Release

**Feature 1 — AI Video Survey (`AIVideoSurvey.astro`).** Customer uploads a
video/photos of their home; a client-side simulation detects furniture from
an item database, generates cubic volume, truck size, and a priced quote;
customer can edit the detected list; the quote is sent to the team via
WhatsApp with the full inventory. *(Documented upgrade path for swapping the
simulation for a real Claude-vision API call via a new
`/api/survey-analyze` endpoint — not implemented in this release.)*

**Feature 2 — Multi-channel follow-up sequence (`follow-up.ts`,
`follow-up-cron.ts`).** Timeline: `instant` (lead submitted → customer
confirmation email + internal SMS), `h4` (4h → WhatsApp template + email),
`h24` (24h, no response → email), `h72` (72h, no response → final nurture
email with ₹500 discount). **Secrets:** `RESEND_API_KEY` +
`LEAD_NOTIFY_EMAIL` (minimum viable — email-only works immediately);
optionally `MSG91_AUTH_KEY`/`MSG91_SENDER_ID`/`MSG91_TEMPLATE_ID`/`TEAM_PHONE`
for SMS; `WABA_TOKEN`/`WABA_PHONE_NUMBER_ID`/`WABA_TEMPLATE_FOLLOWUP` for
WhatsApp; `CRON_SECRET` + `SITE_URL` for the cron endpoint. External cron
(e.g. cron-job.org) hits `GET /api/follow-up-cron?token=...` every 5 minutes.

**Feature 3 —** `/api/lead` now fires `/api/follow-up`'s `instant` step
after every successful lead save, fire-and-forget, never blocking the
WhatsApp flow.

---

## Build & deploy (all releases)

```bash
npm run build
wrangler pages deploy dist
```
