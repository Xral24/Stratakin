// Offline cache for the installed app
const VERSION = 'stratakin-single-v3';
const FILES = ['./', './index.html', './icon-180.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) { e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 }))); return; }
  e.respondWith(caches.match(e.request).then(cached => { const fresh = fetch(e.request).then(res => { if (res && res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone())); return res; }).catch(() => cached); return cached || fresh; }));
});
