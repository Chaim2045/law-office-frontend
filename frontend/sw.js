// Service Worker v5 - No caching, just PWA support
// This SW exists only to enable PWA install. No caching at all.

// Install: clear ALL caches, skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          console.log('SW v5: Deleting cache:', name);
          return caches.delete(name);
        })
      );
    })
  );
});

// Activate: clear any remaining caches, take control, reload tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.navigate(client.url);
        });
      });
    })
  );
});

// Listen for SKIP_WAITING message from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: pass through to network, NO caching at all
self.addEventListener('fetch', (event) => {
  // Do nothing - let the browser handle all requests normally
  return;
});
