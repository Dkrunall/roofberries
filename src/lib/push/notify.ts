// Server-only. Sends Web Push notifications — these reach the customer's
// device even if the tab/browser is fully closed, unlike the in-tab
// Notification API alert (see lib/alerts.ts) which only fires while a tab
// is open. Never imported into client code (only from Server Actions,
// e.g. lib/actions/adminOrders.ts).
import webpush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@roofberries.com';

const pushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
}

/**
 * Sends a "your order is ready" push to every device subscribed for this
 * order. A no-op if VAPID keys aren't configured (see .env.local.example)
 * — the in-tab alert still covers that case, so this is a pure
 * enhancement, never a hard dependency.
 */
async function sendOrderReadyPush(supabase: SupabaseClient<Database>, orderId: string, tableNumber: number) {
  if (!pushConfigured) return;

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('order_id', orderId);
  if (!subs || subs.length === 0) return;

  // Same tag the in-tab alert uses (see showBrowserNotification's call
  // site in OrderStatusView) — if the customer's tab happens to be open
  // when this arrives, the two notifications collapse into one instead of
  // stacking as duplicates in the notification tray.
  const payload = JSON.stringify({
    title: 'Your order is ready! 🔔',
    body: `Table ${tableNumber} — head to your table, staff is on the way.`,
    url: `/order/status?table=${tableNumber}&order=${orderId}`,
    tag: `order-ready-${orderId}`,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      } catch (err) {
        const statusCode = (err as { statusCode?: number } | null)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Push service says this subscription is gone (browser data
          // cleared, permission revoked, etc.) — clean it up rather than
          // retrying it forever.
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('sendOrderReadyPush failed:', err);
        }
      }
    })
  );
}

/**
 * Wraps an order_items mutation that might advance the parent order's
 * (derived) status to 'ready', firing the push exactly once if it
 * actually did. Compares before/after rather than trusting the caller's
 * own status math, since the order's status is computed by a DB trigger
 * (see 0011_order_item_status.sql), not set directly by these actions.
 */
export async function runAndNotifyIfReady<T>(
  supabase: SupabaseClient<Database>,
  orderId: string,
  fn: () => Promise<T>
): Promise<T> {
  const { data: before } = await supabase
    .from('orders')
    .select('status, tables ( table_number )')
    .eq('id', orderId)
    .maybeSingle();

  const result = await fn();

  if (before && before.status !== 'ready') {
    const { data: after } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
    if (after?.status === 'ready') {
      await sendOrderReadyPush(supabase, orderId, before.tables.table_number);
    }
  }

  return result;
}
