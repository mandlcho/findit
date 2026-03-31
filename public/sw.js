const CACHE_NAME = 'findit-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/magnify-icon.svg',
  '/magnify-icon.png',
];

// External resources to pre-cache
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([...STATIC_ASSETS, ...EXTERNAL_ASSETS]).catch(() => {
        // Don't fail install if external assets can't be fetched
        return cache.addAll(STATIC_ASSETS);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // For API calls (overpass, nominatim), use network-first with cache fallback
  if (request.url.includes('overpass-api.de') || request.url.includes('nominatim.openstreetmap.org')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For map tiles, use cache-first (tiles rarely change)
  if (request.url.includes('basemaps.cartocdn.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For everything else, use stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
