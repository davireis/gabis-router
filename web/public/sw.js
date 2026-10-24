// Service worker for the rsrouter PWA.
//
// Caches the app shell (HTML, JS, CSS, WASM, icons) so the installed app opens offline.
// Routing data (.rd5, .brf, .dat) and map tiles are cached explicitly by the app itself
// in the segment and map-tile caches, so this worker does not touch those requests.

// Both values are replaced at build time by the `sw-precache` plugin in vite.config.ts.
// In dev mode they stay as-is and the app shell is cached at runtime instead.
const APP_CACHE_VERSION = 'dev';
const PRECACHE_URLS = [];

const APP_CACHE = `rsrouter-app-${APP_CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(['/', ...PRECACHE_URLS]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k === 'rsrouter-segments-v2' || (k.startsWith('rsrouter-app-') && k !== APP_CACHE))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isDataRequest(url) {
  return (
    url.pathname.endsWith('.rd5') ||
    url.pathname.endsWith('.brf') ||
    url.pathname.endsWith('.dat') ||
    url.pathname.endsWith('.pmtiles')
  );
}

// How long a navigation waits for the network before using the cached page.
// Keeps the app fast on weak connections where requests hang instead of failing.
const NAVIGATION_TIMEOUT_MS = 3000;

// The app shell is precached by plain requests. Module scripts are requested with an Origin
// header, so a server that sends `Vary: Origin` would make every lookup miss. Ignore Vary.
async function networkFirst(request, fallbackUrl, timeoutMs) {
  const cache = await caches.open(APP_CACHE);
  const key = fallbackUrl || request;
  const fromCache = () => cache.match(key, { ignoreSearch: !!fallbackUrl, ignoreVary: true });

  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetch(
      request,
      controller ? { signal: controller.signal } : undefined,
    );
    if (timer) clearTimeout(timer);
    if (response.ok) {
      cache.put(key, response.clone()).catch(() => {});
      return response;
    }
    const cached = await fromCache();
    return cached || response;
  } catch (err) {
    if (timer) clearTimeout(timer);
    const cached = await fromCache();
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isDataRequest(url)) return;

  if (request.mode === 'navigate') {
    // Single page app: every navigation is served by index.html.
    event.respondWith(networkFirst(request, '/', NAVIGATION_TIMEOUT_MS));
  } else if (url.pathname.startsWith('/assets/')) {
    // Hashed build output never changes for a given URL.
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});
