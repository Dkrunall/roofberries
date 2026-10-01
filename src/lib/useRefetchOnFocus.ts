'use client';

import { useEffect } from 'react';

/**
 * Re-runs `refetch` whenever the tab regains focus or becomes visible
 * again.
 *
 * Supabase Realtime (postgres_changes) doesn't replay events missed while
 * its websocket was suspended — and mobile browsers aggressively suspend
 * background tabs' sockets/timers. So a customer who backgrounds the app
 * mid-order (switches to another app while waiting, locks the screen) can
 * come back to a cart or order-status view that's silently stale until
 * some *other* change happens to arrive and refresh it. This closes that
 * gap by forcing a resync the moment the page is looked at again, on top
 * of (not instead of) the live subscription.
 */
export function useRefetchOnFocus(refetch: () => void) {
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') refetch();
    }
    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refetch]);
}
