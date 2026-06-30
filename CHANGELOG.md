# PackersHub — Changelog

Consolidated from 7 separate `CHANGES_v10.x_*.md` release files into one
chronological document. Astro 7.0.3 · Cloudflare Pages adapter v13 ·
Tailwind v4. Newest release at the top.

---

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
