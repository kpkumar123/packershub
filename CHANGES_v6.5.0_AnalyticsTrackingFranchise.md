# PackersHub v6.5.0 — Analytics, Lead-Capture Backup, Order Tracking, Franchise Page

This release adds the three features prioritized in review:
1. Analytics + a backup lead-capture path (so leads aren't lost if a
   customer never sends the WhatsApp message)
2. A real "Track Your Move" customer page
3. A Franchise / Partner-With-Us page

Everything is built to **fail open**: if you haven't created a GA4
property, a Cloudflare KV namespace, or a Resend account yet, the site
still works exactly as before — these features quietly no-op until
configured. Nothing here can break WhatsApp booking, which stays the
primary flow throughout.

**👉 See `SETUP_NEW_FEATURES.md` for the step-by-step activation guide.**
Until those steps are done, you'll have the new pages live but the
backend pieces (GA4 data, KV-backed tracking, email backup) won't be
active yet.

---

## 1. Analytics

### Problem
The site had zero analytics — no GA4, no GTM, no way to see traffic,
conversion funnel, or which CTA actually drives bookings.

### What was added
- **`src/components/Analytics.astro`** (new) — loads GA4 (`gtag.js`) only
  if `PUBLIC_GA_MEASUREMENT_ID` is set in environment variables. If it's
  blank, this component renders a harmless no-op stub instead of a
  broken script tag.
- Exposes `window.phTrack(eventName, params)` globally — every other
  component calls this instead of `gtag` directly, so analytics can
  never throw an error that breaks the page (ad-blockers, offline, etc.
  are all safely swallowed).
- Wired into `src/layouts/BaseLayout.astro` `<head>`, so it loads on
  every page automatically.

### Events now tracked (once GA4 ID is set)
| Event | Fired when |
|---|---|
| `header_call_click` / `header_whatsapp_click` | Header CTA buttons clicked |
| `floating_call_click` / `floating_whatsapp_click` | Floating action button clicked |
| `booking_step_view` | Any Booking Engine step viewed (`step` param) |
| `booking_route_selected` | From/To city chosen in Booking Engine |
| `booking_estimate_shown` | Price calculated (`estimate`, `move_type`) |
| `booking_submitted` | Booking sent via WhatsApp |
| `contact_form_submitted` | Contact page form submitted |
| `franchise_inquiry_submitted` | Franchise page form submitted |
| `track_lookup_success` / `track_lookup_failed` | Track-order lookup result |

This gives a full funnel: page view → route selected → estimate shown →
booking submitted, plus which CTA (header vs floating vs form) actually
converts.

### Files touched
- `src/components/Analytics.astro` (new)
- `src/layouts/BaseLayout.astro` (added `<Analytics />`)
- `src/components/Header.astro`, `src/components/FloatingCTA.astro`,
  `src/components/BookingEngine.astro`, `src/pages/contact.astro`,
  `src/pages/franchise.astro`, `src/pages/track/index.astro` (event calls)
- `.env.example` (added `PUBLIC_GA_MEASUREMENT_ID`)

---

## 2. Lead-Capture Backup

### Problem
Every form on the site (Contact, Booking Engine) only opened a WhatsApp
deep link. If a customer closed the tab, didn't have WhatsApp installed,
or the popup got blocked, that lead was gone — nothing was ever saved
anywhere else.

### What was added
- **`src/pages/api/lead.ts`** (new) — a server endpoint every form now
  calls *in addition to* opening WhatsApp (never instead of). It:
  1. Generates/accepts a Tracking ID (format `PH-XXXXXX`)
  2. Stores the lead in Cloudflare KV if `TRACKING_KV` is bound (this is
     also what powers the Track Your Move page — see below)
  3. Sends an email notification via Resend if `RESEND_API_KEY` +
     `LEAD_NOTIFY_EMAIL` are set — a second, independent backup
  4. **Always returns success** — this endpoint can never block or delay
     the WhatsApp flow, even if it fails internally
- Called from `BookingEngine.astro`, `contact.astro`, and
  `franchise.astro`, always fired **after** `window.open()` for WhatsApp
  so it never risks the popup being blocked by the browser.

### Important design choice: popup-safety
The Tracking ID is generated **client-side** (not awaited from the
server) so it can be included in the WhatsApp message text immediately,
with zero delay before the WhatsApp tab opens. The same ID is then sent
to `/api/lead` to be stored server-side. This avoids the common bug
where `await fetch(...)` before `window.open(...)` causes browsers to
block the popup because it's no longer seen as a direct response to the
user's click.

### Files touched
- `src/pages/api/lead.ts` (new)
- `src/components/BookingEngine.astro` (calls `/api/lead`, shows Tracking
  ID in the success screen, adds it to the WhatsApp message)
- `src/pages/contact.astro` (calls `/api/lead`, adds Ref ID to message)
- `src/pages/franchise.astro` (calls `/api/lead` with `type: franchise`)
- `.env.example` (added `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`)

---

## 3. Track Your Move

### Honesty note
This is a **milestone tracker** — Booking Received → Survey Scheduled →
Packing Crew Assigned → In Transit → Delivered — updated by your team,
**not live GPS**. The homepage copy already says "GPS-tracked vehicles";
this feature does not itself prove that claim. If you want literal GPS
tracking later (e.g. driver-phone location), that's a separate, larger
feature — this gives customers real, honest visibility today without
overstating what exists.

### What was added
- **`src/pages/track/index.astro`** (new) — public page. Customer enters
  their Tracking ID + the phone number used at booking; sees a visual
  stepper of their move's current status and timeline notes.
- **`src/pages/api/track.ts`** (new) — public lookup endpoint. Requires
  **both** Tracking ID and phone (last 4 digits matched) — this is a
  deliberate privacy check so a guessed/leaked Tracking ID alone can't
  expose a customer's move details.
- **`src/pages/admin/orders.astro`** (new) — staff-only page to look up a
  booking by Tracking ID and advance its status, with an optional note
  (e.g. "Crew dispatched, ETA 4 PM"). Protected by a shared secret
  (`ADMIN_TOKEN`) saved once per device. Already excluded from search
  engines via the existing `/admin/` Disallow rule in `robots.txt`.
- **`src/pages/api/admin/order.ts`** (new) — the endpoint behind the
  staff page (GET to look up, POST to update status). Refuses all
  requests unless `ADMIN_TOKEN` is configured and matches.
- A Tracking ID is now shown on the Booking Engine's success screen and
  included in the WhatsApp message, with a "Track your move →" link.
- Added `/track/` and `/franchise/` to `public/llms.txt` for AI/LLM
  discovery, consistent with the rest of the site's AEO setup.

### Requires one-time setup to go live
Until a Cloudflare KV namespace is created and bound (`TRACKING_KV`),
`/track/` shows a clear "online tracking isn't set up yet, please call"
message instead of an error — it degrades gracefully. **See
`SETUP_NEW_FEATURES.md` Section 2.**

### Files touched
- `src/pages/track/index.astro` (new)
- `src/pages/api/track.ts` (new)
- `src/pages/admin/orders.astro` (new)
- `src/pages/api/admin/order.ts` (new)
- `src/components/BookingEngine.astro` (Tracking ID in success screen)
- `src/components/Header.astro` (added "📦 Track Order" link, desktop +
  mobile nav)
- `wrangler.toml` (KV namespace binding placeholder + instructions)
- `src/env.d.ts` (new — TypeScript types for Cloudflare runtime bindings)
- `.env.example` (added `ADMIN_TOKEN`)
- `public/llms.txt` (added new page references)

---

## 4. Franchise / Partner With Us Page

### Why
Supports the BSE SME listing / scale-up roadmap — a credible partner
acquisition page makes "we're building South India's leading moving
brand" a story prospective city partners can act on, not just a slogan.

### What was added
- **`src/pages/franchise.astro`** (new) — full page: why-partner section,
  two partnership models (City Partner/Franchise vs Fleet/Vendor
  Partner), a 4-step process, an FAQ section (reuses the same accessible
  accordion pattern as the homepage FAQ), and a lead form.
- Added to main nav (`src/components/Header.astro`, desktop + mobile).
- **Deliberately no investment figures, royalty percentages, or ROI
  numbers are stated** — these are framed as "discussed on a call" since
  they'd otherwise be fabricated placeholder numbers (the same honesty
  issue flagged and fixed for testimonials/reviews in earlier versions).
  Fill these in once you have real, confirmed terms — see
  `SETUP_NEW_FEATURES.md` Section 3 for exactly where.
- Lead form submits via WhatsApp (same pattern as Contact) and also
  calls `/api/lead` with `type: 'franchise'` for backup capture.

### Files touched
- `src/pages/franchise.astro` (new)
- `src/components/Header.astro` (nav link, desktop + mobile)

---

## Bonus fix: unstyled form inputs (same bug class as v6.4.4's chatbot fix)

While building the Track and Franchise forms, found that `.form-label`,
`.form-input`, and `.form-textarea` — already used on the existing
Contact page — were **referenced in markup but never defined anywhere**
in `global.css`. Same category of bug as the missing chatbot CSS classes
fixed in v6.4.4. Added proper styles (plus a matching `.form-select` and
`.form-error`/`.form-hint` for the new pages) to `src/styles/global.css`.
This was a pre-existing bug on the Contact page, now fixed as a side
effect — Contact form inputs will look visibly more polished after this
update too.

---

## Files changed (full list)

**New files:**
- `src/components/Analytics.astro`
- `src/pages/api/lead.ts`
- `src/pages/api/track.ts`
- `src/pages/api/admin/order.ts`
- `src/pages/track/index.astro`
- `src/pages/admin/orders.astro`
- `src/pages/franchise.astro`
- `src/env.d.ts`
- `SETUP_NEW_FEATURES.md`

**Modified files:**
- `src/layouts/BaseLayout.astro`
- `src/components/Header.astro`
- `src/components/FloatingCTA.astro`
- `src/components/BookingEngine.astro`
- `src/pages/contact.astro`
- `src/styles/global.css`
- `wrangler.toml`
- `.env.example`
- `public/llms.txt`
- `package.json` (version bump → 6.5.0)

## Verified
- All new/edited `.astro` frontmatter blocks and `.ts` API routes
  isolated and checked with `tsc --noEmit` — no syntax errors (only
  expected ambient-type warnings resolved with shims for the isolated
  check; Cloudflare/Astro runtime types are provided by `src/env.d.ts`
  and `astro/client` in the real project).
- All new/edited inline `<script>` blocks extracted and syntax-checked.
- HTML tag balance verified across every new/edited template.
- Could not run a live `astro build` or `astro dev` in this environment
  (no network access to install `node_modules`) — **please run `npm
  install && npm run build` once after unzipping**, before deploying, as
  a final check.

## Next steps (not done in this pass — flagging for awareness)
- The homepage still says "GPS-tracked" vehicles in its copy; consider
  softening that line or building literal GPS tracking later so the
  claim and the feature match exactly.
- The 3 homepage testimonials are still placeholders (flagged since
  v6.4.1) — replace with real customer quotes once available.
- Franchise page investment/royalty figures are intentionally blank —
  fill in once finalized with real numbers.
