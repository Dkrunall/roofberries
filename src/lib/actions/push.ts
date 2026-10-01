'use server';

import { createClient } from '@/lib/supabase/server';

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Registers this device to receive a Web Push "your order is ready"
 * notification for the given order — see lib/push/notify.ts for the send
 * side. Upserts on (order_id, endpoint) so reopening the status page on
 * the same device doesn't create duplicate rows.
 *
 * Deliberately silent on failure: push is a pure enhancement layered on
 * top of the in-tab Notification API alert (lib/alerts.ts), which still
 * works either way — a customer shouldn't see a scary error just because
 * this optional background step didn't go through.
 */
export async function subscribeToOrderPush(orderId: string, subscription: PushSubscriptionInput) {
  const supabase = await createClient();

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      order_id: orderId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: 'order_id,endpoint' }
  );

  if (error) console.error('subscribeToOrderPush failed:', error);
}
