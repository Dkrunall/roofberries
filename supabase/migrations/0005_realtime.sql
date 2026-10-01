-- OPA Bar & Cafe — QR table ordering
-- 0005_realtime.sql: enable Supabase Realtime (postgres_changes) for the
-- orders table. Needed for:
--   - the customer status screen (subscribes to UPDATE on its own order)
--   - the admin dashboard (subscribes to INSERT/UPDATE on all orders)
-- order_items doesn't need this: it's only read once per order (on load /
-- on an orders event), never watched for its own live changes.

alter publication supabase_realtime add table public.orders;
