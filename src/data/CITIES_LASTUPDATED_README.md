# src/data/cities.json — `lastUpdated` field (Module 57.4)

New optional field per city entry, added in v10.7.3:

```json
{ "slug": "nellore", "name": "Nellore", "lastUpdated": "2026-08-17", ... }
```

## Rule: this date must reflect a real content edit, never an auto-refresh

Module 57.4 of the SEO doc explicitly warns against a fake auto-updating
freshness date — Google and AI crawlers both weight genuine freshness,
and a date that never reflects a real change is a signal that erodes
trust once detected (same reasoning as the empty `reviews.json` and the
`llms.txt` Data Accuracy Notice).

**Do:**
- Set/update `lastUpdated` only when you actually edit that city's real
  content (new landmark added, FAQ rewritten, pricing note changed, etc.)
- Leave the field absent for cities that haven't been touched since launch

**Don't:**
- Don't run a script that stamps today's date on all 100 cities at once
- Don't add this field "for SEO" without a real accompanying content change

## What it does when set

- Renders a visible "Page last updated: [date]" line under the H1 on that
  city's page (Module 57.4)
- Feeds `dateModified` into the existing `WebPage`/`BlogPosting` JSON-LD
  block via `SEOHead.astro` (already supported, just needed a caller)

Currently: **no cities have this field set.** Add it city-by-city as you
actually make real edits — don't backfill it in bulk.
