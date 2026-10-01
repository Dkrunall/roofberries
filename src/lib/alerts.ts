import { BRAND } from '@/lib/brand';
// Client-only sound + browser notification helpers. No audio assets —
// tones are synthesized with the Web Audio API so there's nothing to embed
// or fail to load.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') void audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** Call this from inside a click handler once, to satisfy browser autoplay
 *  policies before any later programmatic `playXChime()` call. */
export function primeAudio() {
  getAudioContext();
}

function tone(ctx: AudioContext, freq: number, startTime: number, duration: number, volume = 0.2) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Two-note alert for a new order landing on the admin dashboard. */
export function playNewOrderChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 880, now, 0.16);
  tone(ctx, 1108, now + 0.16, 0.22);
}

/** Three-note "ta-da" for the customer's order going Ready. */
export function playReadyChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 660, now, 0.13);
  tone(ctx, 880, now + 0.15, 0.13);
  tone(ctx, 1108, now + 0.3, 0.28);
}

/** Low double-buzz for an order that's been sitting unacknowledged too long. */
export function playStaleOrderChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 440, now, 0.18, 0.25);
  tone(ctx, 392, now + 0.22, 0.22, 0.25);
}

/** Three quick same-pitch pings for a "Call Waiter" / "Request Bill" —
 *  deliberately distinct from the two-note new-order chime, the rising
 *  three-note ready chime, and the low stale-order buzz, so staff can tell
 *  them apart by ear alone. */
export function playServiceRequestChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 988, now, 0.1, 0.22);
  tone(ctx, 988, now + 0.14, 0.1, 0.22);
  tone(ctx, 988, now + 0.28, 0.16, 0.22);
}

export function vibrateIfSupported(pattern: number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers restrict this to certain contexts — safe to ignore.
    }
  }
}

// ── Browser (Notification API) alerts, for the admin dashboard ───────────
// This is the plain Notification API, not full Web Push: it only fires
// while this browser is running (the dashboard tab can be minimized or in
// another window, but the browser process must stay open). True
// works-when-the-browser-is-closed push would need a service worker + a
// push subscription server, which is a bigger addition — ask if you want it.

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  return isNotificationSupported() ? Notification.permission : null;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  return Notification.requestPermission();
}

export function showBrowserNotification(title: string, body: string, tag = `${BRAND.slug}-order`) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  try {
    // Matching `tag` between this and a Web Push notification for the same
    // event (see lib/push/notify.ts) makes the OS replace rather than
    // stack them, in the rare case both arrive — e.g. the customer's tab
    // is open when the push also lands.
    new Notification(title, { body, tag });
  } catch {
    // Some mobile browsers (Android Chrome) only allow notifications via a
    // Service Worker registration and throw on the direct constructor —
    // fail silently rather than break the dashboard.
  }
}
