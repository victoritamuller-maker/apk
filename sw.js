// Service Worker para Weather Monitor PWA
const CACHE_NAME = 'weather-monitor-v3.0';
const urlsToCache = [
  '/apk/',
  '/apk/index.html',
  '/apk/manifest.json',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap'
];

// Instalación del Service Worker
self.addEventListener('install', function(event) {
  console.log('[SW] Instalando Service Worker v3.0...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Cache abierto');
        // Intentar cachear, pero no fallar si alguno falla
        return cache.addAll(urlsToCache).catch(function(error) {
          console.log('[SW] Error al cachear algunos recursos:', error);
          // Cachear uno por uno
          return Promise.all(
            urlsToCache.map(function(url) {
              return cache.add(url).catch(function(err) {
                console.log('[SW] No se pudo cachear:', url);
              });
            })
          );
        });
      })
      .catch(function(error) {
        console.log('[SW] Error al abrir cache:', error);
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', function(event) {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - devolver respuesta del cache
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Verificar si recibimos una respuesta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(function() {
        // Si falla todo, mostrar página offline si existe
        return caches.match('/apk/index.html');
      })
  );
});

// Escuchar mensajes
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
