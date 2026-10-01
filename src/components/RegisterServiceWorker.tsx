'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on every page load, app-wide — this needs
 * to happen unconditionally, not just when a customer opts into
 * notifications, because Chrome/Android's install ("Add to Home Screen")
 * criteria require an *active* service worker registration regardless of
 * whether push ends up being used. lib/push/subscribeClient.ts separately
 * upgrades to an actual push subscription once notification permission is
 * granted — registration here just makes the app installable.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    }
  }, []);

  return null;
}
