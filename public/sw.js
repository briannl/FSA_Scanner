// Service Worker for FSA Scanner In-Store PWA
const CACHE_NAME = "fsa-scanner-shell-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Activate updated worker immediately without waiting for existing tabs to close
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Purging outdated cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Claim all active clients immediately so updates take effect right away
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-http/https schemes
  if (!url.protocol.startsWith("http")) return;

  // 1. API calls: Network-first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 2. CRITICAL FIX: Navigation & HTML requests: ALWAYS NETWORK-FIRST
  // This guarantees that opening the app or refreshing always gets the latest index.html
  // pointing to the latest versioned JS bundles containing updated product catalogs.
  // Falls back to cached index.html only when strictly offline.
  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname === "/" ||
    url.pathname === "/index.html"
  ) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match("/index.html").then((cached) => {
            if (cached) return cached;
            return caches.match("/");
          });
        })
    );
    return;
  }

  // 3. Static assets with immutable Vite hashes (js, css, images, fonts): Cache-first, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (request.destination === "style" ||
            request.destination === "script" ||
            request.destination === "image" ||
            request.destination === "font")
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      });
    })
  );
});
