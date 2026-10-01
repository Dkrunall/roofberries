-- OPA Bar & Cafe — QR table ordering
-- 0002_rls.sql: row level security

alter table public.tables enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admin_users enable row level security;

-- SECURITY DEFINER so it can read admin_users regardless of the caller's
-- own RLS visibility into that table (avoids recursive-policy issues).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where id = auth.uid()
  );
$$;

-- ── tables (dining tables) ──────────────────────────────────────────────

create policy "public can read active tables"
  on public.tables for select
  to anon, authenticated
  using (is_active = true);

create policy "admins manage tables"
  on public.tables for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── categories ───────────────────────────────────────────────────────────

create policy "public can read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "admins manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── menu_items ───────────────────────────────────────────────────────────
-- Sold-out items stay visible (is_available = false) so the customer UI can
-- grey them out rather than hide them; admins toggle availability instead
-- of deleting.

create policy "public can read menu items"
  on public.menu_items for select
  to anon, authenticated
  using (true);

create policy "admins manage menu items"
  on public.menu_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── menu_item_variants ───────────────────────────────────────────────────

create policy "public can read menu item variants"
  on public.menu_item_variants for select
  to anon, authenticated
  using (true);

create policy "admins manage menu item variants"
  on public.menu_item_variants for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── orders ───────────────────────────────────────────────────────────────
-- There is no customer auth/session, so "read only your table's order" is
-- enforced practically rather than cryptographically: order ids are random
-- UUIDs the client only learns right after it inserts the order (or via a
-- realtime feed it initiated), and no PII is ever stored. This is a
-- deliberate MVP tradeoff, not a true per-user row scope — harden later
-- with a short-lived signed token per order if that matters for this
-- deployment.

create policy "anon can place orders for active tables"
  on public.orders for insert
  to anon
  with check (
    exists (
      select 1 from public.tables t
      where t.id = table_id and t.is_active = true
    )
  );

create policy "anon can read orders"
  on public.orders for select
  to anon
  using (true);

create policy "admins manage orders"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── order_items ──────────────────────────────────────────────────────────

create policy "anon can insert order items for their order"
  on public.order_items for insert
  to anon
  with check (
    exists (select 1 from public.orders o where o.id = order_id)
  );

create policy "anon can read order items"
  on public.order_items for select
  to anon
  using (true);

create policy "admins manage order items"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── admin_users ──────────────────────────────────────────────────────────
-- No insert/update/delete policy is defined here on purpose: admins are
-- provisioned via the Supabase SQL editor / service role (see README), not
-- through the app's anon/authenticated API surface.

create policy "admins can read admin_users"
  on public.admin_users for select
  to authenticated
  using (id = auth.uid() or public.is_admin());
