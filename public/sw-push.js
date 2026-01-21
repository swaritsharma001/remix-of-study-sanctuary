// Service Worker for Push Notifications (StudyX)
// Version: 3.0.0 - Added large image support

// Force immediate activation
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing v3.0.0...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating v3.0.0...');
  event.waitUntil(clients.claim());
});

// Handle push events
self.addEventListener('push', function(event) {
  console.log('[Service Worker v3] Push received');

  event.waitUntil((async () => {
    const origin = self.location.origin;
    const supabaseUrl = 'https://pwdjpguxipapoelnnjnl.supabase.co';
    
    try {
      console.log('[Service Worker v3] Fetching from:', supabaseUrl + '/functions/v1/latest-notification');
      
      const res = await fetch(supabaseUrl + '/functions/v1/latest-notification', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[Service Worker v3] Response status:', res.status);
      
      if (!res.ok) {
        throw new Error('HTTP ' + res.status + ': ' + res.statusText);
      }
      
      const data = await res.json();
      console.log('[Service Worker v3] Got data:', JSON.stringify(data));

      // Build notification options
      const notificationOptions = {
        body: data.body || 'New update available',
        icon: origin + '/notification-icon.png',
        badge: origin + '/notification-icon.png',
        vibrate: [100, 50, 100],
        data: {
          url: data.url || '/',
          dateOfArrival: Date.now(),
        },
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'close', title: 'Dismiss' },
        ],
      };

      // Add large image if available (shown in expanded notification on Android)
      if (data.image) {
        notificationOptions.image = data.image;
        console.log('[Service Worker v3] Including image:', data.image);
      }

      await self.registration.showNotification(
        data.title || 'StudyX',
        notificationOptions
      );
      console.log('[Service Worker v3] ✅ Notification shown with custom message');
    } catch (err) {
      console.error('[Service Worker v3] Error:', err.message || err);

      // Fallback if API fails
      await self.registration.showNotification('StudyX', {
        body: 'New content available',
        icon: origin + '/notification-icon.png',
        badge: origin + '/notification-icon.png',
      });
    }
  })());
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
        // Agar koi window already open hai
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Nahi hai to new window open karo
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
