const CACHE_NAME = 'drag-league-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to fetch and cache each resource individually. This avoids failing the
      // entire install if one resource (e.g. favicon-32.png) is missing.
      await Promise.all(urlsToCache.map(async (url) => {
        try {
          const res = await fetch(url);
          if (res && res.ok) {
            await cache.put(url, res.clone());
            console.log('[SW] cached', url);
          } else {
            console.warn('[SW] resource not cached (bad response):', url, res && res.status);
          }
        } catch (err) {
          console.warn('[SW] resource failed to fetch:', url, err && err.message);
        }
      }));
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple network-first strategy with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Optional: cache GET requests
        if (event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          }).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
  );
});

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
});
