const CACHE_NAME = 'campustrack-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/vite.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Optionally cache GET requests
        if (event.request.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/index.html')))
  );
});
