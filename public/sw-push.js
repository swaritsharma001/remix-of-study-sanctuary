// Service Worker for Push Notifications

// Handle push events
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received');

  // Use absolute URLs for icons (required for proper display on Android)
  const origin = self.location.origin;
  const defaultIcon = origin + '/favicon.png';
  const badgeIcon = origin + '/pwa-192x192.png';

  let data = {
    title: 'StudyX',
    body: 'New content available!',
    icon: defaultIcon,
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
      // Ensure icon is absolute URL
      if (data.icon && !data.icon.startsWith('http')) {
        data.icon = origin + data.icon;
      }
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: badgeIcon,
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
