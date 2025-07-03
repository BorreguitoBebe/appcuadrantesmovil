// Service Worker para PWA Cuadrante Guardia Civil
const CACHE_NAME = 'cuadrante-gc-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/calendar.js',
  '/js/stats.js',
  '/js/pwa.js',
  '/assets/js/simple-pdf.js',
  '/assets/src/BannerGC.png',
  '/assets/src/EscudoGc.svg',
  '/assets/src/FondoCuadrantes.jpg',
  '/assets/src/iconoGC.ico.ico'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalación completa');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Error durante la instalación', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activación completa');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Sirviendo desde cache', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching desde red', event.request.url);
        
        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, show offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for data persistence
self.addEventListener('sync', event => {
  if (event.tag === 'sync-calendar-data') {
    console.log('Service Worker: Sincronizando datos del calendario');
    event.waitUntil(syncCalendarData());
  }
});

// Push notifications (if needed in the future)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de Cuadrante GC',
    icon: '/assets/src/iconoGC.ico.ico',
    badge: '/assets/src/EscudoGc.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Cuadrante',
        icon: '/assets/src/iconoGC.ico.ico'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/assets/src/iconoGC.ico.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Cuadrante GC', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Function to sync calendar data
async function syncCalendarData() {
  try {
    // Get stored data from IndexedDB or localStorage
    const storedData = localStorage.getItem('cuadrante-data');
    if (storedData) {
      // Here you could send data to a server if needed
      console.log('Service Worker: Datos sincronizados');
    }
  } catch (error) {
    console.error('Service Worker: Error sincronizando datos', error);
  }
} 