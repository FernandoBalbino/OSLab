const CACHE_VERSION = 'oslab-offline-v57';
const CACHE_PREFIX = 'oslab-offline-';

const CORE_FILES = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './precache-manifest.json',
  './service-worker.js'
];

function scopedUrl(path) {
  return new URL(path, self.registration.scope).href;
}

async function getPrecacheUrls() {
  const response = await fetch(scopedUrl('./precache-manifest.json'), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Falha ao carregar o manifesto de cache: ${response.status}`);
  const projectFiles = await response.json();
  return [...new Set([...CORE_FILES, ...projectFiles])].map(scopedUrl);
}

// Baixa cada arquivo direto do servidor (cache: 'reload'), para nenhuma cópia antiga do navegador entrar na versão nova,
// e avisa a página do progresso para a tela de inicialização mostrar a porcentagem.
async function precache() {
  const urls = await getPrecacheUrls();
  const cache = await caches.open(CACHE_VERSION);
  let done = 0;
  const report = async () => {
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    clients.forEach((client) => client.postMessage({ type: 'precache-progress', done, total: urls.length }));
  };
  const queue = [...urls];
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const response = await fetch(new Request(url, { cache: 'reload' }));
      if (!response.ok) throw new Error(`Falha ao baixar ${url}: ${response.status}`);
      await cache.put(url, response);
      done += 1;
      if (done % 8 === 0 || done === urls.length) await report();
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const scopeUrl = new URL(self.registration.scope);
  const isInternal = requestUrl.origin === scopeUrl.origin && requestUrl.pathname.startsWith(scopeUrl.pathname);
  if (!isInternal) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(event.request, { ignoreSearch: true }))
            || (requestUrl.pathname.endsWith('/') && await caches.match(new URL('index.html', requestUrl).href, { ignoreSearch: true }))
            || (await caches.match(scopedUrl('./index.html'), { ignoreSearch: true }))
            || caches.match(scopedUrl('./offline.html'), { ignoreSearch: true });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
