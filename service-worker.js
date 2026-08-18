// service-worker.js
// Faz cache do "app shell" para a interface, hora, data, calculadora,
// memória e notas continuarem funcionando offline. IA, pesquisa e sites
// externos continuam exigindo conexão.

const CACHE_NAME = 'luana-cache-v1';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './modules/router/router.js',
  './modules/system/system.js',
  './modules/calculator/calculator.js',
  './modules/search/search.js',
  './modules/apps/appManager.js',
  './modules/browser/browser.js',
  './modules/memory/memoryStore.js',
  './modules/notes/notesStore.js',
  './modules/ai/aiClient.js',
  './modules/speech/speech.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Só aplicamos cache-first para o próprio app (mesma origem).
  // Chamadas externas (IA, Google, apps) sempre vão direto pra rede.
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);
    })
  );
});
