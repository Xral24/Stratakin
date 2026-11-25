// Offline cache: every file of the game is stored on first load, so the installed app runs without a connection.
const VERSION = 'stratakin-v34';
const FILES = ['./', './index.html', './style.css', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png',
  './js/util.js', './js/world.js', './js/render.js', './js/glb.js', './js/player.js', './js/controls.js', './js/kin.js', './js/weather.js', './js/wild.js', './js/village.js', './js/battle.js', './js/quests.js', './js/fishing.js', './js/music.js', './js/film.js', './js/cards.js', './js/device.js', './assets/card_bg_lost.jpg', './assets/card_bg_meadow.jpg', './assets/card_x_rex.jpg', './assets/card_bg_forest.jpg', './assets/card_bg_river.jpg', './assets/card_bg_beach.jpg', './assets/card_bg_peaks.jpg', './assets/card_bg_dunes.jpg', './assets/card_bg_snow.jpg', './assets/card_bg_swamp.jpg', './assets/card_bg_lava.jpg', './assets/card_bg_crystal.jpg', './assets/card_bg_storm.jpg',  './js/ui.js', './js/main.js', './js/saves.js', './js/hazards.js', './js/npcs.js', './js/camps.js', './js/mer.js', './js/lab.js', './js/avatar.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) { // fonts etc: network, fall back to nothing
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  // own files: cache first, refresh in the background so the next launch gets updates
  e.respondWith(caches.match(e.request).then(cached => {
    const fresh = fetch(e.request).then(res => { if (res && res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone())); return res; }).catch(() => cached);
    return cached || fresh;
  }));
});
