# PackersHub v6.4.3 — Local Move (Within-City) Fix

## Problem (flagged in review)

The Booking Engine priced every route using Haversine distance between two
cities' lat/lng centroids. When a customer selected the **same city** for
both "From" and "To" (a genuine local/within-city move), the distance
calculation returned 0 km, which is meaningless — and the UI showed a
confusing "Approx. 0 km road distance" badge labelled "Local Move" while
the price silently fell back to a flat ₹2,500 minimum, identical to a
short-but-real inter-city hop. There was no dedicated local-move flow the
way NoBroker/Porter have.

## What was fixed

**1. Same-city detection (`state.isLocalMove`)**
- `src/components/BookingEngine.astro`
- `updateDistanceInfo()` now checks `fromCity.slug === toCity.slug`. If
  true, the Haversine path is skipped entirely (no more fake "0 km").

**2. Dedicated local-move messaging**
- Badge now reads "🏙️ Local Move" with copy "Local shifting within
  {City}" instead of a distance figure.
- For genuinely different cities, the old "Local Move (<60km)" / "Short
  Distance" / "Interstate" 3-way split is now a clearer 2-way split:
  "Short Distance" (<250km) vs "Interstate" — "local" is reserved for
  actual same-city moves only.

**3. Pickup / Drop locality fields**
- New optional "Pickup Area / Locality" and "Drop Area / Locality" text
  inputs appear only when a local move is detected (e.g. "BV Nagar" →
  "Stonehousepet"). These flow into the route banner and the WhatsApp
  booking message so the team gets real area context instead of just
  "Nellore → Nellore".

**4. Distance-independent local pricing**
- `calculatePrice()` now takes an `isLocalMove` flag.
- Local moves use a flat in-town transport charge by move type
  (house ₹1,200 / office ₹1,800 / bike ₹500 / car ₹800 / storage ₹600 /
  partial ₹800) instead of `distance × rate`, and skip the ₹2,500
  inter-city minimum.
- Packing, loading, floor charges, special items, and add-ons are
  unchanged (those are genuinely about the property/items, not distance).
- Result: a local 2BHK house move now estimates ~₹7,680 instead of being
  floored to the same ~₹8,500+ a short inter-city move would get; a local
  bike move estimates ~₹1,900 instead of ~₹3,900.

**5. Discoverability — "Local move?" suggestion chip**
- As soon as a customer picks a "From" city, a dashed suggestion chip
  appears: "📍 Moving within {City} itself? Tap here for a local
  shifting quote" — one tap auto-fills "To City" with the same city. This
  was added because customers wouldn't otherwise think to type the same
  city twice.

## Files changed
- `src/components/BookingEngine.astro` only — no other files touched.

## Verified
- Inline `<script define:vars>` block extracted and checked with
  `node --check` — no syntax errors.
- `calculatePrice()` unit-tested in isolation for local (house/bike) and
  inter-city (short/long) scenarios — output sanity-checked manually.
- Full Astro build (`astro build`) was **not** run in this environment
  (no network access to install `node_modules`). Please run
  `npm install && npm run build` once before deploying to confirm no
  Astro/TypeScript-level errors in this file.
