# 🚚 PackersHub — Astro Static Site v2.0
## South India's #1 Packers & Movers | SEO/GEO/AEO/AIO/SXO 100/100

---

## 📋 Project Overview

| Feature | Details |
|---|---|
| Framework | Astro 4.x (Static Site) |
| Styling | Tailwind CSS v3 + Custom Animations |
| Pages | 1 Home + 5 State + 100 City + 6 Static = **112 pages** |
| Sitemaps | 5 sitemaps (index, main, cities, services, blog, images) |
| SEO Modules | 47 modules implemented (see below) |
| Performance | Prefetch, lazy-load, WebP, PWA, SW, CSP headers |
| Deployment | Netlify (zero-config) |

---

## 🗂 Directory Structure

```
packershub/
├── astro.config.mjs          # Astro + Tailwind + Sitemap
├── tailwind.config.mjs       # Custom design tokens
├── netlify.toml              # Build + redirect rules
├── public/
│   ├── robots.txt            # AI+SEO crawlers allowed
│   ├── sitemap-index.xml     # Master sitemap
│   ├── sitemap-main.xml      # Core pages
│   ├── sitemap-cities.xml    # 100 cities
│   ├── sitemap-services.xml  # Services & static
│   ├── sitemap-blog.xml      # Blog posts
│   ├── sitemap-images.xml    # Image SEO
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                 # Service Worker
│   ├── favicon.svg           # SVG favicon
│   ├── _headers              # Cache + security headers
│   └── _redirects            # Canonical + 301 rules
└── src/
    ├── styles/global.css     # Global CSS + animations
    ├── data/
    │   ├── states.json       # 5 states data
    │   └── cities.json       # 100 cities data
    ├── components/
    │   ├── SEOHead.astro     # All 47 meta modules
    │   ├── Header.astro      # Sticky nav + mega menu
    │   ├── Footer.astro      # 4-col footer
    │   ├── Hero.astro        # L99 hero with animations
    │   ├── Services.astro    # 6 service cards
    │   ├── Process.astro     # 6-step how it works
    │   ├── TrustStrip.astro  # Stats bar
    │   ├── Testimonials.astro # Reviews with schema
    │   ├── QuoteForm.astro   # Netlify form + validation
    │   ├── FAQ.astro         # FAQPage schema
    │   ├── CitiesGrid.astro  # Reusable cities grid
    │   ├── ChatBot.astro     # 24x7 AI chatbot
    │   ├── CallButton.astro  # Floating call button
    │   └── WhatsAppButton.astro # Floating WA button
    ├── layouts/
    │   └── BaseLayout.astro  # Main HTML wrapper
    └── pages/
        ├── index.astro       # Homepage
        ├── about.astro       # About page
        ├── services.astro    # Services page
        ├── contact.astro     # Contact page
        ├── privacy.astro     # Privacy policy
        ├── terms.astro       # Terms & conditions
        ├── 404.astro         # Custom 404
        ├── blog/
        │   └── index.astro   # Blog listing
        └── [state]/
            ├── index.astro   # State landing (×5)
            └── [city].astro  # City landing (×100)
```

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → Opens http://localhost:4321

# 3. Build for production
npm run build
# → Output in /dist

# 4. Preview production build
npm run preview
```

---

## 🌐 Deployment — Netlify (Recommended)

### Option A: Netlify Drop (Fastest)
1. Run `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag & drop the `/dist` folder
4. Done! Site is live.

### Option B: Git + Netlify CI/CD
1. Push repo to GitHub/GitLab
2. New site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set ENV: `NODE_VERSION = 20`
6. Deploy!

### Option C: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

---

## 📸 Required Images (add to /public/)

| File | Size | Description |
|---|---|---|
| `hero.jpg` | 1200×900px | Main hero — movers packing truck |
| `og-image.jpg` | 1200×630px | Social media preview card |
| `icon-192.png` | 192×192px | PWA icon small |
| `icon-512.png` | 512×512px | PWA icon large |
| `favicon-32.png` | 32×32px | Browser tab icon |

---

## 🔍 SEO Modules Implemented (47/47)

| # | Module | Status |
|---|---|---|
| 01 | robots.txt (AI + Search crawlers) | ✅ |
| 02 | Multi-sitemap (index + 5 sitemaps) | ✅ |
| 03 | Cities sitemap (100 URLs) | ✅ |
| 04 | Primary meta tags | ✅ |
| 05 | Open Graph tags | ✅ |
| 06 | Twitter Card | ✅ |
| 07 | GEO tags (region, position, ICBM) | ✅ |
| 08 | AEO (speakable, voice search) | ✅ |
| 09 | AIO (AI engine hints) | ✅ |
| 10 | Resource hints (preconnect, dns-prefetch) | ✅ |
| 11 | PWA (manifest, service worker, icons) | ✅ |
| 12 | Organization schema (MovingCompany) | ✅ |
| 13 | WebSite + SearchAction schema | ✅ |
| 14 | BreadcrumbList schema | ✅ |
| 15 | FAQPage schema | ✅ |
| 16 | AggregateRating schema | ✅ |
| 17 | LocalBusiness schema (city-level) | ✅ |
| 18 | Review schema | ✅ |
| 19 | Dynamic state landing pages (5) | ✅ |
| 20 | Dynamic city landing pages (100) | ✅ |
| 21 | City-specific pricing tables | ✅ |
| 22 | Canonical tags (all pages) | ✅ |
| 23 | Hreflang (en-IN) | ✅ |
| 24 | Heading hierarchy (H1→H6) | ✅ |
| 25 | Alt text on all images | ✅ |
| 26 | Lazy loading + fetchpriority | ✅ |
| 27 | Core Web Vitals (LCP/CLS/FID) | ✅ |
| 28 | Mobile-first responsive design | ✅ |
| 29 | Skip-to-content accessibility | ✅ |
| 30 | ARIA labels + roles | ✅ |
| 31 | Focus management | ✅ |
| 32 | Reduced motion support | ✅ |
| 33 | Security headers (CSP, HSTS) | ✅ |
| 34 | Cache-control headers | ✅ |
| 35 | 301 redirects + canonical domain | ✅ |
| 36 | 404 custom page | ✅ |
| 37 | Netlify forms (quote + contact) | ✅ |
| 38 | WhatsApp floating button | ✅ |
| 39 | Call floating button | ✅ |
| 40 | AI Chatbot (24×7) | ✅ |
| 41 | Blog system | ✅ |
| 42 | Internal linking (state→city) | ✅ |
| 43 | Nearby cities links | ✅ |
| 44 | Prefetch navigation | ✅ |
| 45 | Content Security Policy | ✅ |
| 46 | Scroll reveal animations | ✅ |
| 47 | Service Worker offline cache | ✅ |

---

## 📞 Business Details

- **Phone:** +91 77310 74075
- **Email:** info@packershub.in
- **Address:** BV Nagar, Nellore, AP — 524004
- **Website:** www.packershub.in

---

*Built with ❤️ for South India | PackersHub v2.0 | Astro + Tailwind*
