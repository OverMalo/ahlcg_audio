const CACHE_VERSION = "v2";
const STATIC_CACHE = `ahlcg-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ahlcg-runtime-${CACHE_VERSION}`;
const SOUNDTRACK_CACHE = "ahlcg-soundtrack-v1";
const BASE = "/ahlcg_audio";

const APP_ASSETS = [
  `${BASE}/`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("ahlcg-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE && key !== SOUNDTRACK_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function withSecurityHeaders(response) {
  if (!response) return response;
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.delete("expires");
  const ct = headers.get("content-type");
  if (ct && ct.startsWith("text/javascript")) {
    headers.set("content-type", ct.replace("text/javascript", "application/javascript"));
  }
  if (!headers.get("cache-control")) {
    headers.set("cache-control", "no-cache");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function networkFirst(request, fallbackToCache = true) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok && request.method === "GET") {
      runtimeCache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    if (!fallbackToCache) throw new Error("Network request failed");

    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    return caches.match(`${BASE}/`);
  }
}

async function cacheFirst(request) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await runtimeCache.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      runtimeCache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return caches.match(`${BASE}/`);
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigationRequest = event.request.mode === "navigate";
  const isAudioRequest = event.request.destination === "audio";
  const isDynamicAsset =
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "font" ||
    event.request.destination === "video" ||
    event.request.destination === "manifest" ||
    url.pathname.endsWith(".json");

  if (isNavigationRequest || isDynamicAsset) {
    event.respondWith(networkFirst(event.request).then(withSecurityHeaders));
    return;
  }

  if (isAudioRequest) {
    event.respondWith(cacheFirst(event.request).then(withSecurityHeaders));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return withSecurityHeaders(cachedResponse);

      return fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();

          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return withSecurityHeaders(networkResponse);
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match(`${BASE}/`);
          }
        });
    })
  );
});
