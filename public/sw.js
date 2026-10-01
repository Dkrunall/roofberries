// Roofberries Cocktail Bar — service worker
//
// Only job: receive Web Push events and show a notification, and route a
// tap on that notification to the right order-status page. This is what
// lets "your order is ready" reach the customer even if they've closed the
// tab/browser entirely — the in-tab Notification API alert (see
// src/lib/alerts.ts) can't do that, it only fires while a tab is open.
// Deliberately not a full offline/asset-caching service worker (no
// `fetch` caching strategy) — that's a separate concern this app doesn't
// need yet.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A bare passthrough handler. Chrome's installability check wants a
// service worker with *a* fetch listener present; this doesn't attempt any
// caching, just falls through to the network exactly as if there were no
// service worker at all.
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Roofberries Cocktail Bar', body: event.data.text() };
  }

  const { title, body, url, tag } = data;

  event.waitUntil(
    self.registration.showNotification(title || 'Roofberries Cocktail Bar', {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: tag || 'roofberries-notification',
      vibrate: [200, 100, 200],
      data: { url: url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an already-open tab on that order's status page rather than
      // stacking a new one.
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
