const CACHE_NAME = "hh-dash-v2";
const SUPABASE_CACHE_MAX_ENTRIES = 50;

// Cache-first for static assets
const STATIC_PATTERN = /\/_next\/static\//;

// Network-first for Supabase REST API
const SUPABASE_PATTERN = /\.supabase\.co\/rest\/v1\//;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Cache-first for static assets
  if (STATIC_PATTERN.test(request.url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Network-first for Supabase API responses (fallback to cache when offline)
  if (SUPABASE_PATTERN.test(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
              // Limit cache size
              cache.keys().then((keys) => {
                const supabaseKeys = keys.filter((k) => SUPABASE_PATTERN.test(k.url));
                if (supabaseKeys.length > SUPABASE_CACHE_MAX_ENTRIES) {
                  supabaseKeys
                    .slice(0, supabaseKeys.length - SUPABASE_CACHE_MAX_ENTRIES)
                    .forEach((k) => cache.delete(k));
                }
              });
            });
          }
          return response;
        })
        .catch(() =>
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.match(request, { ignoreVary: true }))
        )
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful page responses
        if (response.ok && request.mode === "navigate") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
