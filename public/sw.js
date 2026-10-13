// Service Worker self-cleanup and deregistration script
// Prevents stale script caching and multiple React runtime collisions

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Pass through all fetch requests directly to the network without caching
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
