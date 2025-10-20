const VERSION = "v1.0.0";
const STATIC_CACHE = `majnu-static-${VERSION}`;
const RUNTIME_CACHE = `majnu-runtime-${VERSION}`;
const PRECACHE_URLS = [
  "/",
  "/play",
  "/leaderboard",
  "/result",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icon.svg",
  "/og/win.webp",
  "/og/loss.webp",
  "/majnu-states/0.webp",
  "/majnu-states/1.webp",
  "/majnu-states/2.webp",
  "/majnu-states/3.webp",
  "/majnu-states/4.webp",
  "/majnu-states/5.webp",
  "/audio/correct-guess.mp3",
  "/audio/wrong-guess.mp3",
  "/audio/win.mp3",
  "/audio/loss.mp3",
];

const ASSET_PATTERN = /\.(?:js|css|png|jpg|jpeg|webp|svg|gif|ico|mp3|woff2?)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const request = new Request(url, { cache: "reload" });
            const response = await fetch(request);
            if (response && response.ok) {
              await cache.put(request, response.clone());
            }
          } catch (error) {
            console.warn("[sw] precache skipped", url, error);
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const [runtimeCached, staticCache] = await Promise.all([
      cache.match(request),
      caches.open(STATIC_CACHE),
    ]);
    if (runtimeCached) {
      return runtimeCached;
    }
    const precached = await staticCache.match(request);
    if (precached) {
      return precached;
    }
    const offline = await caches.match("/offline.html");
    return offline || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  return cached || (await networkPromise) || Response.error();
}
