const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;

const STATIC_FILES = [
  '/',
  '/index.html',
  '/main.js',
  '/modules/auth.js',
  '/modules/profile.js',
  '/modules/exchange.js',
  '/index.css',
  '/manifest.json',
  '/favicon.ico'
];


// Install Event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      for (const url of STATIC_FILES) {
        try {
          await cache.add(url);
          console.log(`[Service Worker] Cached static file: ${url}`);
        } catch (err) {
          console.warn(`[Service Worker] Failed to cache: ${url}`, err);
        }
      }
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== API_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Always fetch fresh session status to avoid stale login state
  if (requestUrl.pathname === '/api/session') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle API GET requests
  if (requestUrl.pathname.startsWith('/api/') && event.request.method === 'GET') {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle all other GET requests
  if (event.request.method === 'GET') {
    event.respondWith(handleStaticRequest(event.request));
  }
});

// Serve API requests from cache and update 
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(err => {
      console.warn('[Service Worker] API fetch failed, using cache:', err);
      return cachedResponse;
    });

  return (
    cachedResponse ||
    fetchPromise.catch(
      () =>
        new Response('[]', {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
    )
  );
}

// Respond with a cached asset falling back to network
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request);
}
