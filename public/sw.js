const CACHE_NAME = 'zorando-pwa-v1';
const ASSETS = [
  '/',
  '/favicon-zorando.svg',
  '/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use cache.addAll cautiously, or ignore errors if index.html isn't physically there
      return cache.addAll(ASSETS).catch(err => console.log('Pre-caching assets failed, continuing...', err));
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
