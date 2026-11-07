// Self-destructing Service Worker to permanently eliminate all stale cache traps
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log("[Service Worker] Nuking cache:", key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: "window" });
    }).then((clients) => {
      for (const client of clients) {
        // Automatically reload any open browser tab to load fresh assets
        if (client.url && "navigate" in client) {
          client.navigate(client.url);
        }
      }
    })
  );
});

// Pass through all fetch requests straight to the network without caching HTML
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
