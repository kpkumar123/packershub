// PackersHub v10 — Service Worker
// Astro 7.0.3 | Cloudflare Pages
// Strategy: Cache-first for static assets, Network-first for HTML pages
// Never cache: /api/, /admin/, /track/ (live data)

const CACHE_NAME = 'packershub-v10';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.svg',
  '/manifest.webmanifest',
];

// Never cache these paths (live/dynamic)
const BYPASS = ['/api/', '/admin/', '/track/', '/sitemap'];

const shouldBypass = (url) => BYPASS.some(p => url.pathname.startsWith(p));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS.filter(u => u !== '/offline.html'))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Pass through non-GET and bypass paths
  if (event.request.method !== 'GET' || shouldBypass(url)) return;

  // Static assets: cache-first
  if (url.pathname.startsWith('/_assets/') || url.pathname.match(/\.(png|svg|jpg|jpeg|webp|woff2|css|js)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // HTML pages: network-first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
