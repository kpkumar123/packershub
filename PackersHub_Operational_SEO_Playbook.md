# PackersHub — Operational SEO Playbook (Modules 45, 49, 53–59)
Generated: 2026-08-17 | v10.7.3

These modules were left out of earlier builds because the docx itself
calls them **recurring team practices, not one-time deployments** — "none
of them are one-time deployments; all five [55–59] are recurring
practices (monthly, quarterly, or per new page)." A file can't run a
monthly practice for you. What it *can* do is hand you the exact
templates, checklists, and log formats so every occurrence is
fill-in-the-real-data rather than starting from a blank page — which is
what this playbook does, module by module.

One correction made throughout: the docx's own Module 45 press-release
template contains the same fabricated figures already rejected elsewhere
in this project (unverified rating/review figures, unverified moves count, unverified accreditation claims, an unverified
founding year, and a fixed price figure). Rewritten below with those fields left as
real placeholders instead.

---

## Module 45 — Press Release Template (honest version)

```
HEADLINE: PackersHub Expands Packers & Movers Service to {New City}

FOR IMMEDIATE RELEASE
Date: {Month Year}
Contact: +91 77310 74075 | info@packershub.in

{City}, {State} — PackersHub, a packers and movers company headquartered
in BV Nagar, Nellore, Andhra Pradesh, has expanded service coverage to
{City}.

The company offers home shifting, office relocation, bike transport, car
carrier service, and warehouse storage, with goods-in-transit insurance
included on every move and an all-inclusive written quote after a free
assessment.

"{Real, attributable quote from an actual PackersHub spokesperson}," said
{Name, Title}.

Residents of {City} can request a free quote via phone or WhatsApp at
+91 77310 74075, or at https://www.packershub.in/{state}/{city-slug}.

About PackersHub:
PackersHub is headquartered in BV Nagar, Nellore, Andhra Pradesh, and
serves 100 cities across Andhra Pradesh, Telangana, Tamil Nadu, Karnataka,
and Kerala.

Contact: +91 77310 74075 | www.packershub.in
###
```
Rule: every `{bracket}` must be filled with something real before this
goes out. No rating, review count, unverified accreditation, or founding-year claim
gets added back in unless it's independently verifiable.

Distribution: local Andhra/Telangana business news portals, PRLog/other
free PR wire (no paid inflated-reach services needed for local news).

---

## Module 49 — AI-Assisted Workflow Policy (internal, adopt as-is)

1. **Keyword discovery** — run city+service combos through an AI
   assistant monthly for long-tail/"near me" variants → cross-check
   volume in a real tool (Semrush/Ubersuggest free tier) before adding
   to any live page.
2. **Content drafting** — AI drafts first-pass city copy from verified
   local facts already in `cities.json`; a human checks every fact
   before publishing. AI never invents a local fact that isn't already
   in the data file.
3. **Automation** — AI-drafted WhatsApp follow-ups/review requests are
   human-approved before going live (matches the `follow-up.ts` /
   `PackersHub_SEO_Completion_Pack.md` templates already delivered).
4. **Metadata QA** — run an AI check across all 100 city pages monthly
   for duplicate/missing title tags, meta descriptions, alt text.
5. **Changelog** — log every AI-assisted change:

```
| Date | Module | What changed | Who approved |
|------|--------|---------------|--------------|
```
Keep this table in `CHANGELOG.md` (already exists in the repo) under a
new `## AI-Assisted Changes` heading — start it the next time an
AI-assisted edit ships.

---

## Module 53 — Semantic Topic Clusters (status + real next step)

Already true today: each state page (`[state]/index.astro`) links down
to its cities, and each city page links back up to its state — the
state→city half of the pillar structure is live.

**Not yet built:** a dedicated URL per service (`/household-shifting`,
`/office-relocation`, etc.) that lists all 100 cities filtered by that
service. Today `services.astro` is a single page describing all
services, not a cluster of pages. Building 10 real service-cluster pages
is a proper feature addition (new routes + filtering logic against
`cities.json`), not a copy-paste template fill — flagging honestly as
the next real coding task rather than shipping a thin version of it here.

---

## Module 54 — News SEO + Service Schema + AI Auditing

**A. News SEO** — for each new city launch, publish a short dated
`"PackersHub now live in {City}"` post to `/blog/`. Use a real 1200px+
photo (site truck/team, not stock) for Discover eligibility. A dedicated
Google News sitemap is only worth adding once there's a steady publish
cadence (weekly+) — premature otherwise.

**B. Service schema** — already present per city via `OfferCatalog` →
`Offer` → `Service` in `SEOHead.astro`'s `MovingCompany` block (covers
this without needing separate Product schema, since there's no physical
product).

**C. Monthly AI SEO audit — run this checklist and date it:**
```
| Date | Type checked | Status (DONE/PARTIAL/GAP) | Note |
|------|---------------|----------------------------|------|
| | Title tags 50-60 chars, all pages | | |
| | Meta descriptions 150-160 chars | | |
| | One H1 per page | | |
| | Image alt text present | | |
| | Internal links per city page | | |
| | Schema validates (Rich Results Test) | | |
| | No fabricated claims in new copy | | |
```
**Quarterly:** run a free Screaming Frog crawl (up to 500 URLs) +
Semrush free-tier check, score SEO/GEO/AEO/AIO/SXO out of 100 each,
log date | score before | score after | fix applied.

---

## Module 55 — Research Skill

**55.1 Competitive Content Gap Matrix** — now a live tool:
`/admin/seo-ops` → Competitor tab. Log entries only from things actually
observed (a competitor's live page/listing) — leave blank until checked,
per the doc's own instruction not to estimate unverified numbers.

**55.2 Keyword Intent Buckets (apply per city):**
| Intent | Example | Content need |
|---|---|---|
| Transactional | "packers movers Nellore price" | Quote form + phone CTA above fold |
| Local-navigational | "movers near [landmark]" | Neighborhood coverage list |
| Informational | "how much does shifting cost" | Blog/FAQ, not a landing page |
| Comparison | "PackersHub vs Agarwal Packers" | Factual, non-disparaging FAQ block |

**55.3 AI Query Mining (monthly)** — run these in ChatGPT/Perplexity/
Gemini/AI Overview, log whether PackersHub is mentioned (feeds directly
into the `/admin/seo-ops` Citation tab already built):
- "Best packers and movers in Nellore"
- "How much do packers and movers cost in Vijayawada"
- "Reliable movers for a 2BHK shift in Kurnool"
- "Packers and movers with GPS tracking in Andhra Pradesh" *(only ask
  this once GPS tracking is a confirmed live customer-facing feature —
  otherwise skip; don't seed a claim you'd then have to walk back)*
- "Are packers and movers in Nellore trustworthy"

**55.4 Customer Language Mining** — pull recurring phrases from real
Google/JustDial reviews (once collected) on pain points (hidden charges,
delays, damaged goods) and feed exact customer wording into new blog
briefs (Module 56.3 below) rather than generic copy.

---

## Module 56 — Content Skill

**56.1 Minimum unique-content checklist per city page** (target 35-40%
unique text vs. shared boilerplate):
- [ ] Distance/route data from Nellore HQ shown in visible text (Haversine
      data already computed in `nearbyCities.ts` — currently schema-only,
      surface it in-copy too)
- [ ] 3-5 real local landmarks/areas named
- [ ] City-specific FAQ block (5-8 Qs), not the same set reused elsewhere
- [ ] One dated, city-specific testimonial/case study once real ones exist
- [ ] One local note (society rules, monsoon timing, traffic/access)

**56.3 Blog content brief template** (use for every post in the
Module 21 calendar already delivered):
```
Title: [Question] — [City/Topic] [Year]
Direct-answer opener: first 40-60 words fully answer the title
Internal links required: 1 city page, 1 service page, 1 related post
Schema: Article + FAQPage (if Q&A format)
CTA: WhatsApp button placed right after the direct answer, not just at the end
```

**56.4 E-E-A-T content rules** — real author byline + bio (already
enforced per prior audit), real photos over stock where possible, only
currently-true claims, date every testimonial and remove/update ones
older than 18 months.

---

## Module 57 — On-Page Skill

**57.2 Heading hierarchy** — already correct per template (one H1 =
city/service name, H2 per section, H3 inside FAQ). Spot-check this in
the monthly Module 54 audit above rather than re-verifying by hand here.

**57.3 Schema layering** — LocalBusiness/MovingCompany ✅, FAQPage ✅ on
all 100 pages via `FAQ.astro`, BreadcrumbList ✅. Not yet added: HowTo
schema on step-format blog posts (candidate: "Moving Checklist: The
Complete Timeline Guide" — add when next edited) and QAPage schema
(only apply to a page that's a single definitive Q&A, not the multi-FAQ
city pages — no current page fits that shape without restructuring, so
not force-fit here).

**57.4 Freshness signal** — ✅ shipped this build: `city.lastUpdated`
optional field + visible "Page last updated" line, see
`src/data/CITIES_LASTUPDATED_README.md` for the honesty rule governing it.

---

## Module 58 — Internal Linking Skill

Hub-and-spoke (Home → State → City → Service → Blog) and nearby-city
in-body linking are already live (`nearbyCities.ts`, wired into city
pages — confirmed in the original audit).

**58.4 Orphan page audit (quarterly, do this manually):**
1. Run a free Screaming Frog crawl (500 URL cap covers the current site).
2. Filter pages receiving fewer than 2 internal links.
3. Fold any flagged page into the nearest relevant hub or blog post.
Log results in the same table format as the Module 54 audit above.

---

## Module 59 — AI Visibility Skill

**59.1 llms.txt** — ✅ already live, more disciplined than the doc's own
version (includes the Data Accuracy Notice).

**59.2 Brand entity building (do these as real account actions):**
- [ ] Claim/verify Google Business Knowledge Panel for the brand entity
- [ ] Create a Wikidata entry (name, founding info, service area, site link)
- [ ] Keep NAP byte-for-byte identical across GBP/JustDial/Sulekha/
      IndiaMART/footer — use the exact block from
      `PackersHub_SEO_Completion_Pack.md`
- [ ] Pursue local press/directory mentions that name PackersHub next to
      "packers and movers Nellore"

**59.3 Answer-ready content blocks** — only publish once the underlying
fact is real:
```
Pricing block: "PackersHub charges based on distance, load volume, and
service level. A typical [X]BHK local move within Nellore ranges from
₹[real range]." — needs a real price range from you before publishing.

Coverage block (safe to publish now):
"PackersHub operates in 100 cities across Andhra Pradesh, Telangana,
Tamil Nadu, Karnataka, and Kerala, headquartered in Nellore."
```

**59.4 AI Citation Monitoring Loop** — ✅ shipped as `/admin/seo-ops`
(Citation tab), replacing the doc's static log table with a working tool.

**59.5 Additional AI-facing schema** — Speakable ✅ already present in
`SEOHead.astro`. QAPage — see 57.3 note above (not force-fit onto
current page shapes).

---

## What's genuinely still open after this playbook
1. **Module 53 service-cluster pages** — real coding task, not a template fill (flagged above, not attempted here to avoid a thin/rushed version)
2. **59.3 pricing block** — needs a real price range from you
3. Everything already flagged in prior audits: sameAs URLs, 5+ real reviews, GST/Udyam number, native-reviewed language pages
4. Monthly/quarterly cadences above (54.C, 55.3, 58.4) are yours to run — the templates and the `/admin/seo-ops` tool exist so each run is fast, not so it runs itself
