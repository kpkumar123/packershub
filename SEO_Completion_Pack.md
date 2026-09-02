# PackersHub — SEO Modules Completion Pack
## Modules 20, 21, 41, 42 — real content, no fabricated data
Generated: 2026-08-17 | Source data: live Footer.astro / llms.txt (verified NAP)

---

## 1. Directory / Citation Listings (Modules 20 & 41)
Copy-paste this **exact same NAP** into every directory — consistency across
listings is itself a local-SEO ranking signal. Do not vary the address or
phone format between sites.

**Business Name:** PackersHub
**Category:** Packers and Movers / Relocation Services
**Address:** BV Nagar, Nellore, Andhra Pradesh — 524004, India
**Phone / WhatsApp:** +91 77310 74075
**Email:** info@packershub.in
**Website:** https://www.packershub.in
**Service Area:** 100 cities across Andhra Pradesh, Telangana, Tamil Nadu, Karnataka, Kerala
**Hours:** 24/7 (phone & WhatsApp support)

**Short description (150 char, use as-is on JustDial/Sulekha):**
> Professional packers & movers based in Nellore, AP. Serving 100 cities across South India — house shifting, office relocation, bike/car transport, warehousing.

**Long description (for GMB "About" / IndiaMART company profile):**
> PackersHub is a packers and movers company headquartered in BV Nagar,
> Nellore, Andhra Pradesh, serving 100 cities across Andhra Pradesh,
> Telangana, Tamil Nadu, Karnataka and Kerala. Services include house
> shifting, office relocation, bike transport, car carrier service, and
> warehouse storage with the first 48 hours free. Every move includes
> goods-in-transit insurance and an all-inclusive written quote after a
> free assessment — no hidden charges. Contact via phone or WhatsApp at
> +91 77310 74075, available 24/7.

**Listings to create (Module 20 — action items, not code):**
| Platform | Status | Note |
|---|---|---|
| Google Business Profile | Needs setup/claim | Primary category: "Moving company"; add all 100 service-area cities |
| JustDial | Needs setup | Use short description above |
| Sulekha | Needs setup | Use long description above |
| IndiaMART | Needs setup | List services as separate catalog items |
| LogisticMart | Needs setup | Freight/logistics category |

Once any of these are live, send me the profile URLs and I'll add them to
`sameAs` in `SEOHead.astro` immediately.

---

## 2. Blog Editorial Calendar (Module 21)
Existing 5 posts already cover: packing guide, interstate moves, moving
checklist, office relocation, Hyderabad local guide. Next 3 months should
target city-clusters and service gaps not yet covered, mapped to real
search intent (no invented statistics inside any post):

| Month | Post title | Target keyword focus | City/service link |
|---|---|---|---|
| Month 1 | "Packers and Movers in Vijayawada: Local Moving Guide" | vijayawada packers movers | Links to Vijayawada city page |
| Month 1 | "Bike Transport Guide: What to Expect When Shipping a Two-Wheeler" | bike transport charges south india | Links to bike-transport service |
| Month 2 | "Moving to Bengaluru from Andhra Pradesh: Interstate Checklist" | bengaluru relocation from andhra pradesh | Karnataka state page + AP cities |
| Month 2 | "Warehouse Storage: When You Need It and How It Works" | warehouse storage packers movers | storage-warehousing page |
| Month 3 | "Packers and Movers in Coimbatore: Complete Local Guide" | coimbatore packers movers | Coimbatore city page |
| Month 3 | "Car Transport: Open vs Enclosed Carrier — Which to Choose" | car carrier service south india | vehicle-transport page |

Each post: 800–1200 words, one FAQ block (feeds AEO schema), 2–3 internal
links to real city/service pages, one alt-tagged image already in
`src/assets/blog/` style.

---

## 3. WhatsApp / SMS Review-Request Templates (Module 42)
These are honest requests sent to real customers after a completed move —
not fabricated reviews. Only real replies should ever be added to
`reviews.json`.

**Template A — sent day after move completion:**
> Hi [Customer Name], this is PackersHub. Hope your move to [City] went
> smoothly! If you have 2 minutes, a quick Google review would really
> help us — [Google review link]. Thank you for choosing us. 🙏

**Template B — follow-up if no response after 3 days:**
> Hi [Customer Name], just checking in — how's everything at your new
> place? If you were happy with the move, a short review here means a
> lot: [Google review link].

**SOP:**
1. Send Template A within 24 hours of move completion (manual or via
   `follow-up.ts` cron already in codebase).
2. If no response in 72 hours, send Template B once — no further follow-up.
3. Only reviews left directly on Google/GBP get referenced; none are
   copied into site code until 5+ real reviews exist (existing rule).

---

## Still blocked — needs your real input, not fabrication
1. **sameAs schema** — send real FB/Instagram/GMB/LinkedIn URLs once live
2. **GST/Udyam number** — for footer NAP precision
3. **5+ real reviews** — activates Review/AggregateRating schema automatically
4. **Telugu/Tamil/Kannada/Malayalam pages** — need native-speaker content review before publishing (machine translation would hurt rather than help E-E-A-T)
