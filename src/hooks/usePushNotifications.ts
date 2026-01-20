import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// VAPID public key - this should match the one in your backend
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const getPushRegistration = async () => {
    // Ensure our push-capable SW is registered (the PWA SW may not handle `push` events)
    const existing = await navigator.serviceWorker.getRegistration('/');

    // If the existing SW is already our push SW, reuse it; otherwise register our own.
    if (existing?.active?.scriptURL?.includes('sw-push.js')) {
      return existing;
    }

    const reg = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  };

  const checkSubscription = async () => {
    try {
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      console.error('Push notifications not supported');
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('Missing VAPID public key (VITE_VAPID_PUBLIC_KEY)');
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Get (or register) service worker registration
      const registration = await getPushRegistration();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to backend
      const { error } = await supabase.functions.invoke('push-subscribe', {
        body: {
          subscription: subscription.toJSON(),
          action: 'subscribe',
        },
      });

      if (error) {
        console.error('Error saving subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      console.log('Push subscription successful');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from backend
        await supabase.functions.invoke('push-subscribe', {
          body: {
            subscription: subscription.toJSON(),
            action: 'unsubscribe',
          },
        });
      }

      setIsSubscribed(false);
      console.log('Push unsubscribe successful');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
};
