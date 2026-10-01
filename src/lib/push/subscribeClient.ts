'use client';

// Client-safe Web Push helpers — no server-only imports, so this can be
// pulled into any client component. Pairs with public/sw.js (the push
// event handler) and lib/actions/push.ts (persists the subscription) /
// lib/push/notify.ts (sends to it).

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
}

/**
 * Subscribes this device to Web Push, if it isn't already. The service
 * worker itself is already registered app-wide on every page load (see
 * RegisterServiceWorker, needed for installability regardless of push) —
 * the `.register()` call here just waits on that same registration
 * (idempotent, harmless either way). Returns null — rather than throwing —
 * for any of "unsupported browser", "permission not granted yet", or an
 * unexpected failure, so callers can treat push as a best-effort
 * enhancement on top of the in-tab Notification API alert that already
 * works regardless (see lib/alerts.ts).
 */
export async function ensurePushSubscription(): Promise<{ endpoint: string; keys: { p256dh: string; auth: string } } | null> {
  if (!isPushSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // TS's lib.dom types Uint8Array as generic over its buffer type;
        // the DOM PushManager typings still want the non-generic form.
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
      });
    }
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
    return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } };
  } catch (err) {
    console.error('Push subscription failed:', err);
    return null;
  }
}
