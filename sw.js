// Service Worker for Our Notes PWA
const CACHE_NAME = 'our-notes-v1';
const urlsToCache = [
  '/couples-notes/',
  '/couples-notes/index.html',
  '/couples-notes/style.css',
  '/couples-notes/app.js',
  '/couples-notes/manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache install failed:', err);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event (for Android/Desktop)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New message from your partner!',
    icon: '/couples-notes/icon-192.png',
    badge: '/couples-notes/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'new-note',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('💕 Our Notes', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/couples-notes/')
  );
});
