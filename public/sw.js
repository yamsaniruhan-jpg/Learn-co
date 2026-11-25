// Lightweight Safe Service Worker for Learn.co PWA
// Enables Home Screen installability and offline root-shell fallback
// while strictly bypassing Vite dev module requests and API calls.

const CACHE_NAME = 'learnco-shell-v3';
const OFFLINE_APP_CACHE = 'learnco-offline-app-v1';
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/logo-mark.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('learnco-shell-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_OFFLINE_PACKAGE' || !Array.isArray(event.data?.urls)) {
    return;
  }
  const safeUrls = event.data.urls
    .filter((item) => typeof item === 'string' && item.startsWith('/'))
    .slice(0, 120);

  event.waitUntil(
    caches.open(OFFLINE_APP_CACHE).then((cache) =>
      Promise.allSettled(
        safeUrls.map((url) =>
          fetch(url, { credentials: 'same-origin' }).then((res) => {
            if (res && res.ok) {
              return cache.put(url, res.clone());
            }
          })
        )
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Vite dev modules, HMR internals, or live API endpoints.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.searchParams.has('v') ||
    url.searchParams.has('t') ||
    url.searchParams.has('import') ||
    /\.(ts|tsx|js|jsx|mjs|cjs|css|map|hot-update\.json)$/i.test(url.pathname)
  ) {
    return;
  }

  // App-shell navigation: network-first, falling back to cached root shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match('/').then((cached) => cached || Response.error()))
    );
    return;
  }

  // Manifest, Home Screen icons & logo: network-first with cached fallback.
  if (
    url.pathname === '/manifest.json' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/logo-mark.png' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
