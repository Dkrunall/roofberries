-- OPA Bar & Cafe — QR table ordering
-- 0008_shared_cart_and_feedback.sql: table-shared realtime cart + post-order rating

-- ── cart_items ───────────────────────────────────────────────────────────
-- One shared, realtime-synced cart per dining table: every phone that
-- scanned the same table's QR reads and writes this list, so a group can
-- build one order together. Rows are denormalized (item name/price/variant
-- label copied in at add-time) so a realtime INSERT/UPDATE/DELETE payload
-- is self-contained on every other device — no extra join round-trip needed
-- to render it. This is only a *shopping* list: placeOrder() always
-- re-derives real prices from menu_items/menu_item_variants at checkout
-- time (see src/lib/actions/orders.ts), so a stale/tampered unit_price here
-- can never affect what's actually charged.
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  -- Stable per-device id (generated client-side, kept in localStorage) so a
  -- guest's own repeated taps on the same item/variant/notes combine into
  -- one line, while a different guest adding the identical item keeps their
  -- own separate, attributed line.
  guest_id uuid not null,
  guest_name text not null default 'Guest',
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  menu_item_name text not null,
  category_name text not null,
  variant_id uuid references public.menu_item_variants(id) on delete cascade,
  variant_label text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0 and quantity <= 50),
  notes text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cart_items_table_id_idx on public.cart_items(table_id);

alter table public.cart_items enable row level security;

-- Same practical (not cryptographic) trust model as orders/order_items in
-- 0002_rls.sql: no customer auth exists, so "this table's cart" is enforced
-- by needing the table's QR/number, not by a signed session. Any guest at
-- the table can add, adjust, or remove any line — matching how a shared
-- paper order pad works in person.
create policy "public can read cart items"
  on public.cart_items for select
  to anon
  using (true);

create policy "public can add cart items for active tables"
  on public.cart_items for insert
  to anon
  with check (
    exists (select 1 from public.tables t where t.id = table_id and t.is_active = true)
  );

create policy "public can update cart items"
  on public.cart_items for update
  to anon
  using (true)
  with check (true);

create policy "public can delete cart items"
  on public.cart_items for delete
  to anon
  using (true);

create policy "admins manage cart items"
  on public.cart_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter publication supabase_realtime add table public.cart_items;

-- ── order_feedback ───────────────────────────────────────────────────────
-- One optional 1-5 star rating (+ comment) per order, collected on the
-- live status screen once an order reaches "served".

create table public.order_feedback (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index order_feedback_order_id_idx on public.order_feedback(order_id);

alter table public.order_feedback enable row level security;

create policy "anon can submit feedback for served orders"
  on public.order_feedback for insert
  to anon
  with check (
    exists (select 1 from public.orders o where o.id = order_id and o.status = 'served')
  );

create policy "anon can read feedback"
  on public.order_feedback for select
  to anon
  using (true);

create policy "admins manage feedback"
  on public.order_feedback for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
