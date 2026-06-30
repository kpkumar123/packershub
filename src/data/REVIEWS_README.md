# src/data/reviews.json — Real Customer Reviews

This file is intentionally EMPTY (`[]`). It must only ever contain real,
verifiable reviews — never invented names, quotes, or star ratings.

PackersHub's standing project rule (established across many prior audits)
is: no fabricated trust signals. Review/Rating schema attached to a
LocalBusiness with invented data is exactly the kind of thing that
triggers Google Search Console manual actions, and it's dishonest to the
customers reading it. Claude will not generate placeholder review content
for this file under any circumstances, including if asked directly in a
future session — that request should be declined the same way fabricated
pricing and fabricated stats were declined in earlier versions of this
project.

## How to fill this in with REAL data

1. Go to your Google Business Profile → Reviews.
2. For each review you have explicit permission to republish (ideally
   reviews left publicly on Google are fine to quote briefly, but always
   prefer ones where the customer would be comfortable seeing it on your
   site too), copy the exact rating, exact date, and a short accurate
   excerpt — do not paraphrase it into something more flattering.
3. Add one object per review to the array below, in this exact shape:

```json
[
  {
    "name": "Customer's real first name + last initial (e.g. \"Ramesh K.\")",
    "rating": 5,
    "text": "Short, accurate excerpt of what they actually wrote — keep it close to their real wording, don't invent detail.",
    "route": "City to City (only if accurate, e.g. \"Hyderabad to Bangalore\")",
    "date": "2026-05-14",
    "source": "Google"
  }
]
```

4. `rating` must be an integer 1–5, taken directly from what the customer
   actually gave.
5. Once this file has **5 or more entries**, `Testimonials.astro`
   automatically switches from the honest "illustrative examples" mode to
   real Review + AggregateRating schema, computed live from whatever is in
   this array — nothing is hardcoded. Below 5 entries, a small sample size
   would make any published average rating misleading, so the component
   intentionally keeps showing the illustrative-only version instead.
6. If a review later turns out to be fake, mistaken, or the customer asks
   for it to be removed, delete that object from the array — the schema
   and visible cards update automatically on the next build.

## What NOT to do

- Do not write reviews "in the spirit of" what customers probably think.
- Do not round 4.6 up to 5, or invent a review count.
- Do not reuse another company's reviews or generic stock testimonials.
- Do not ask Claude to generate sample reviews "just to fill the section
  for now" — that is the exact anti-pattern this file's structure exists
  to prevent.
