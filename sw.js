// Workout-Datenbank — Service Worker
const CACHE = 'workout-db-v3';
const ASSETS = [
  './workout-datenbank.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap'
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Data/API requests (JSONBin, YouTube oEmbed, proxy, thumbnails) always go to
//   the network and are never cached, so synced data stays fresh.
// - App shell files: cache-first, fall back to network.
self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (url.includes('jsonbin.io') ||
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('ytimg.com') ||
      url.includes('corsproxy.io')) {
    return; // let the browser handle it normally (no caching)
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
