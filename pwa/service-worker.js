// Speak Native Service Worker
const CACHE_VERSION = 'dei-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap'
];

// Install event: Cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[Service Worker] Caching critical assets');
        return cache.addAll(ASSETS).catch(err => {
          console.log('[Service Worker] Some assets failed to cache:', err);
          // Don't fail installation if some assets can't be cached
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_VERSION) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event: Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (API calls, external resources)
  if (url.origin !== location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first strategy for API calls
  if (url.pathname.includes('/api/') || request.url.includes('anthropic') || request.url.includes('googleapis')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Don't cache API responses by default
          return response;
        })
        .catch(() => {
          // Offline: return cached version if available
          return caches.match(request)
            .then(response => response || new Response('Offline', { status: 503 }));
        })
    );
    return;
  }

  // Cache-first strategy for app shell (HTML, CSS, JS)
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // Return from cache
          return response;
        }

        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.ok && request.method === 'GET') {
              const responseToCache = response.clone();
              caches.open(CACHE_VERSION)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed for:', request.url, error);
            // Return cached version or offline page
            return caches.match(request)
              .then(response => response || new Response('Offline', { status: 503 }));
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded and ready');
