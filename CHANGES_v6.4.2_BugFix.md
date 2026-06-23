# PackersHub v6.4.2 — Bug Fix Pass

## What was fixed in this ZIP

**1. WhatsApp link encoding bug (all 100 city pages)**
- File: `src/pages/[state]/[city].astro`
- The hero "WhatsApp Quote" button built its message text with raw,
  un-encoded characters: `text=Hi PackersHub! I need help moving in
  ${d.city}.` — spaces, `!`, and `.` were never percent-encoded.
- Every other WhatsApp link in the codebase (Header, FloatingCTA,
  BookingEngine, Contact form) already wrapped this in
  `encodeURIComponent()`; this one page template was the only place
  that didn't.
- **Fix:** wrapped the message string in `encodeURIComponent()`, same
  pattern used everywhere else. Affects all 100 generated city pages
  at build time — no per-city action needed.

**2. `/booking/` was an orphan page**
- `src/pages/booking.astro` existed, had its own SEO title/description,
  and was in the sitemap — but zero internal links pointed to it from
  Header, Footer, the homepage, or any city/state page. Google could
  only find it via sitemap crawl; a human visitor browsing the site
  would never see it.
- **Fix:** added a "Get Quote" link to:
  - Desktop nav (`Header.astro`, after the Cities mega-menu)
  - Mobile nav (`Header.astro`)
  - Footer "Company" column (`Footer.astro`, labelled "Get a Quote")

## What was NOT changed (flagged but out of scope for this pass)

These were noted during the review but are product decisions, not
bugs — left for you to decide on, since they change behavior, not just
fix broken code:

- **No "Within City" vs "Between Cities" split in the Booking Engine.**
  Selecting the same city for both pickup and drop doesn't crash (the
  ₹2,500 minimum charge applies), but there's no dedicated local-move
  flow the way NoBroker/Porter have. Worth adding if local moves are a
  meaningful share of your leads.
- **No phone-number format validation in the Booking Engine's submit
  step.** The Contact page form is fine; the booking flow doesn't
  check phone format before generating the WhatsApp message.
- **`ANTHROPIC_API_KEY` reminder** — not a bug, just a deploy checklist
  item: the AI chatbot needs this set in Cloudflare Pages env vars or
  it will keep showing "AI assistant not configured."
