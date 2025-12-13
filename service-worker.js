// A unique name for our cache
const CACHE_NAME = 'glen-service-manager-v1';

// The list of files we want to cache
// Changed absolute paths to relative to support different hosting environments
const URLS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com/',
  // Note: Dynamically imported modules from the importmap might not be cached this way
  // and would be fetched from the network. For a full offline experience, these would
  // need to be locally hosted and added to this list.
];

// Install event: This is where we cache our app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Activate event: This is where we clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: This is where we serve files from the cache
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we found a match in the cache, return it
        if (response) {
          console.log('[Service Worker] Found in cache:', event.request.url);
          return response;
        }

        // If not, fetch from the network
        console.log('[Service Worker] Not in cache, fetching:', event.request.url);
        return fetch(event.request).then(
          (networkResponse) => {
            // We can optionally cache new requests here if needed
            return networkResponse;
          }
        );
      })
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        // You could return a custom offline page here if you had one
      })
  );
});