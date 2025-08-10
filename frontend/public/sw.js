// Service Worker for push notifications and offline functionality

const CACHE_NAME = 'habit-tracker-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Cache install failed:', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push event for notifications
self.addEventListener('push', event => {
  console.log('Push event received:', event);
  
  const options = {
    body: 'Time to check your habits!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/icon-192x192.png'
      }
    ]
  };

  let promiseChain;
  
  if (event.data) {
    try {
      const payload = event.data.json();
      promiseChain = self.registration.showNotification(
        payload.title || 'Habit Tracker',
        {
          ...options,
          body: payload.body || options.body,
          icon: payload.icon || options.icon,
          data: payload.data || options.data
        }
      );
    } catch (error) {
      promiseChain = self.registration.showNotification('Habit Tracker', options);
    }
  } else {
    promiseChain = self.registration.showNotification('Habit Tracker', options);
  }

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification click Received.');

  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync habit completions when back online
      syncHabitCompletions()
    );
  }
});

async function syncHabitCompletions() {
  try {
    // This would sync any offline habit completions
    console.log('Syncing habit completions...');
    // Implementation would depend on your offline storage strategy
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}