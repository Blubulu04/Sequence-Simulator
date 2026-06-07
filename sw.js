const CACHE_NAME = 'circuit-sim-v1';
const ASSETS = [
  './index.html',
  './style.css',
  './components.js',
  './wiring.js',
  './simulator.js',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
