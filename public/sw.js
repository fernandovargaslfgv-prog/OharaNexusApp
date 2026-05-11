const CACHE_NAME = 'nexus-cache-v1';

// Recursos mínimos para que la app no muestre el dinosaurio de Google
const CORE_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/placeholder-manga.jpg'
];

// 1. INSTALACIÓN: Guardamos la base de la app
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Nexus SW] Precargando assets core...');
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 2. ACTIVACIÓN: Limpiamos cachés viejas si actualizas la app
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Nexus SW] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. INTERCEPTOR: La magia negra del Modo Offline
self.addEventListener('fetch', (event) => {
  // Ignoramos peticiones POST/PUT (como guardar favoritos o historial)
  if (event.request.method !== 'GET') return;

  // Estrategia "Network First" (Red Primero):
  // Intentamos pedirle el dato al servidor. Si estás offline, sacamos el clon de la caché.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonamos la respuesta exitosa y la guardamos para el futuro
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // No cacheamos extensiones de Chrome ni cosas raras
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, resClone);
          }
        });
        return response;
      })
      .catch(() => {
        console.log('[Nexus SW] Estás offline. Sirviendo desde caché:', event.request.url);
        return caches.match(event.request);
      })
  );
});