const CACHE_NAME = 'esl-cache-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => {
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Cache first with network fallback for static assets
self.addEventListener('fetch', event => {
  // Avoid caching analytics, firebase auth or firestore requests directly in service worker
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Avoid intercepting/caching development, Vite, HMR, and source assets
  if (
    url.pathname.includes('/src/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.vue') ||
    url.searchParams.has('import') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  if (
    url.href.includes('firestore.googleapis.com') ||
    url.href.includes('identitytoolkit.googleapis.com') ||
    url.href.includes('/api/auth') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch background update for cache if connected
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {
            /* Ignore network errors of background update */
          });
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Do not cache API routes, only static assets
            if (!event.request.url.includes('/api/')) {
              cache.put(event.request, responseToCache);
            }
          });

          return networkResponse;
        })
        .catch(() => {
          // Return index.html for navigation requests (SPA)
          if (event.request.mode === 'navigate') {
            return caches.match('./') || caches.match('./index.html');
          }
        });
    })
  );
});
