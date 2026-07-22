// public/sw.js
// Service Worker for offline support and caching

const CACHE_NAME = 'shopsense-v2';
const RUNTIME_CACHE = 'shopsense-runtime-v2';
const STATIC_ASSETS = [
  '/',
  '/shopping',
  '/cart',
  '/signin',
  '/signup',
  '/offline.html',
];

const OFFLINE_RESPONSE = new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
const OFFLINE_IMAGE = new Response(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="12">Offline</text></svg>',
  { status: 200, headers: { 'Content-Type': 'image/svg+xml' } }
);

function cacheResponse(request, response) {
  if (response && response.status === 200) {
    try {
      const clone = response.clone();
      caches.open(RUNTIME_CACHE).then((cache) => {
        cache.put(request, clone).catch((err) => console.log('Cache put error:', err));
      });
    } catch (err) {
      console.log('Clone error:', err);
    }
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API calls - network only, no caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }

  // HTML pages - network first, fallback to cache then offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          cacheResponse(request, response);
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached || caches.match('/offline.html').then((offline) =>
              offline || OFFLINE_RESPONSE.clone()
            )
          )
        )
    );
    return;
  }

  // Static assets - cache first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          cacheResponse(request, response);
          return response;
        })
        .catch(() => {
          if (request.destination === 'image') {
            return OFFLINE_IMAGE.clone();
          }
          return OFFLINE_RESPONSE.clone();
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
