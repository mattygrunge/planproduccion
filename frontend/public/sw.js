// NexxaPlus Service Worker v1.0
const CACHE_NAME = "nexxaplus-cache-v1";
const STATIC_CACHE = "nexxaplus-static-v1";
const DYNAMIC_CACHE = "nexxaplus-dynamic-v1";

// Archivos estáticos esenciales para cachear
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...");
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Cacheando archivos estáticos");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Instalación completada");
        return self.skipWaiting(); // Activa inmediatamente el nuevo SW
      })
      .catch((error) => {
        console.error("[SW] Error durante la instalación:", error);
      })
  );
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activando Service Worker...");
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Elimina caches antiguos
              return name !== STATIC_CACHE && name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log("[SW] Eliminando cache antiguo:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log("[SW] Activación completada");
        return self.clients.claim(); // Toma control de todos los clientes
      })
  );
});

// Estrategia de caché: Network First con fallback a cache
// Esto es ideal para una app que necesita datos actualizados
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean GET
  if (request.method !== "GET") {
    return;
  }

  // Ignorar requests a la API (queremos datos frescos)
  if (url.pathname.startsWith("/api")) {
    return;
  }

  // Ignorar Chrome extensions y otros protocolos
  if (!url.protocol.startsWith("http")) {
    return;
  }

  event.respondWith(
    // Intentar red primero
    fetch(request)
      .then((response) => {
        // Si la respuesta es válida, la guardamos en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, buscamos en cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si no está en cache y es una navegación, devolver index.html (SPA)
            if (request.mode === "navigate") {
              return caches.match("/index.html");
            }
            return new Response("Offline - Recurso no disponible", {
              status: 503,
              statusText: "Service Unavailable"
            });
          });
      })
  );
});

// Escuchar mensajes desde la app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

// Manejo de notificaciones push (para futuro uso)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "Nueva notificación de NexxaPlus",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || "NexxaPlus", options)
    );
  }
});

// Click en notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/")
  );
});

console.log("[SW] Service Worker cargado");
