-- OPA Bar & Cafe — QR table ordering
-- 0013_push_subscriptions.sql: Web Push subscriptions for "your order is
-- ready" alerts that work even if the customer's tab/browser is closed —
-- the existing in-tab Notification API alert (see lib/alerts.ts) only
-- fires while the tab is actually open.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  -- A browser's push subscription: the push-service URL to POST to, plus
  -- the two keys needed to encrypt the payload for that specific device.
  -- Standard shape of PushSubscription.toJSON() from the browser.
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  -- One row per device per order — re-subscribing the same device (e.g.
  -- reopening the status page) upserts rather than duplicating.
  unique (order_id, endpoint)
);

create index push_subscriptions_order_id_idx on public.push_subscriptions(order_id);

alter table public.push_subscriptions enable row level security;

-- Same practical trust model as orders/cart_items/service_requests
-- (0002_rls.sql, 0008_shared_cart_and_feedback.sql, 0010_service_requests.sql):
-- no customer auth exists, so this is scoped by knowing a real order id,
-- not a signed session. The data itself is low-stakes — an opaque push
-- endpoint URL that's useless without the server's own VAPID private key,
-- no PII — so unlike cart_items there's no separate "wipe everyone's data"
-- blast radius to guard against here.
create policy "anon can subscribe to push for an existing order"
  on public.push_subscriptions for insert
  to anon
  with check (exists (select 1 from public.orders o where o.id = order_id));

-- No anon SELECT/UPDATE/DELETE policy: subscriptions are only ever read to
-- actually send a push (from updateOrderItemStatus/advanceOrderItems,
-- which run under the calling admin's own authenticated session — see
-- "admins manage push subscriptions" below) or cleaned up server-side when
-- the push service reports a subscription as expired/revoked. The browser
-- never needs to read this table back.

create policy "admins manage push subscriptions"
  on public.push_subscriptions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
