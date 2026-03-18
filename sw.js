const CACHE_NAME = 'disfer-pos-v1';

// Archivos a cachear para funcionamiento offline
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Instalar — cachear assets
self.addEventListener('install', e => {
  console.log('[SW] Instalando...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar — limpiar cachés viejos
self.addEventListener('activate', e => {
  console.log('[SW] Activando...');
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — red primero, caché como respaldo
self.addEventListener('fetch', e => {
  // Solo interceptar GET del mismo origen
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Guardar copia fresca en caché
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Sin internet — usar caché
        return caches.match(e.request)
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});
