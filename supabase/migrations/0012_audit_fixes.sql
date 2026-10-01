-- OPA Bar & Cafe — QR table ordering
-- 0012_audit_fixes.sql: three independent fixes from a full-app audit,
-- shipped together since the app code in this same change depends on all
-- three being applied.

-- ── 1. tables: let anon read a table regardless of is_active ────────────
-- getOrderForTable/getTableRunningTotal embed `tables!inner(table_number)`
-- while running as anon. The old "public can read active tables" policy
-- meant that embed silently failed to resolve the moment staff deactivated
-- a table — so a customer still on their own already-placed order's status
-- screen would suddenly get "order not found" and a running total of zero,
-- even though nothing about their order actually changed.
--
-- Safe to open up: nothing else relies on this policy to enforce "only
-- active tables are usable" — every place that rule actually matters
-- (ordering, cart, service requests) already has its own explicit
-- `.eq('is_active', true)` filter in the query itself, independent of RLS.
-- table_number/qr_code_url/is_active aren't sensitive (the QR code is
-- physically on the table).
drop policy "public can read active tables" on public.tables;

create policy "public can read tables"
  on public.tables for select
  to anon, authenticated
  using (true);

-- ── 2. cart_items: scope UPDATE/DELETE (and SELECT) to active tables ────
-- These policies were `using (true)` / `with check (true))` with *zero*
-- scoping — anyone holding the public anon key (visible in any browser
-- bundle) could call the PostgREST endpoint directly, with no table_id
-- filter at all, and wipe or rewrite every table's in-progress shared cart
-- restaurant-wide. Requiring the row's table to be an active table doesn't
-- make this cryptographically sound (there's still no per-table session —
-- see the trust-model note in 0008_shared_cart_and_feedback.sql, a
-- deliberate MVP tradeoff), but it does close off blind, unscoped wipes
-- across every table, active or long-since-turned-over.
drop policy "public can read cart items" on public.cart_items;
drop policy "public can update cart items" on public.cart_items;
drop policy "public can delete cart items" on public.cart_items;

create policy "public can read cart items"
  on public.cart_items for select
  to anon
  using (exists (select 1 from public.tables t where t.id = cart_items.table_id and t.is_active = true));

create policy "public can update cart items"
  on public.cart_items for update
  to anon
  using (exists (select 1 from public.tables t where t.id = cart_items.table_id and t.is_active = true))
  with check (exists (select 1 from public.tables t where t.id = cart_items.table_id and t.is_active = true));

create policy "public can delete cart items"
  on public.cart_items for delete
  to anon
  using (exists (select 1 from public.tables t where t.id = cart_items.table_id and t.is_active = true));

-- ── 3. service_requests: make the "no duplicate pending request" guard
--      atomic ────────────────────────────────────────────────────────────
-- createServiceRequest's dedupe check was a SELECT followed by a separate
-- INSERT with nothing in the database backing it — two guests tapping
-- "Call Waiter" in the same race window (or one guest double-tapping on a
-- slow connection) could both pass the "no existing pending row" check
-- before either insert landed, producing duplicate pending rows for the
-- same table+type. A partial unique index makes the second insert fail
-- outright instead of silently succeeding; the action layer now catches
-- that and treats it as the no-op it was always meant to be.

-- Clean up any pending duplicates already sitting in the table first —
-- the index creation below fails outright if any still exist. Keeps the
-- earliest pending row per (table_id, type), using id as a tiebreaker for
-- the vanishingly unlikely case of an exact timestamp collision.
delete from public.service_requests a
using public.service_requests b
where a.table_id = b.table_id
  and a.type = b.type
  and a.status = 'pending'
  and b.status = 'pending'
  and (a.created_at, a.id) > (b.created_at, b.id);

create unique index service_requests_pending_unique
  on public.service_requests (table_id, type)
  where status = 'pending';
