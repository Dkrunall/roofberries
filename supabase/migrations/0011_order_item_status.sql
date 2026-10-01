-- OPA Bar & Cafe — QR table ordering
-- 0011_order_item_status.sql
--
-- Per-item status: a poured drink is done in seconds, a plated dish can
-- take 20 minutes — bundling every line under one order-level status
-- forced the kitchen to wait for the slowest item before marking anything
-- "ready". Kitchen/bar staff can now advance each item independently.
--
-- An order's own `status` (0001_schema.sql) stays the single thing the
-- customer status screen and admin history read — it's just no longer
-- hand-set. The trigger below keeps it in sync automatically as the
-- *least advanced* status among its items (an order isn't "ready" until
-- every item is ready), so nothing downstream of `orders.status` needs to
-- change.

alter table public.order_items
  add column status order_status not null default 'placed';

create index order_items_status_idx on public.order_items(status);

-- Backfill: existing items inherit their order's current status.
update public.order_items oi
set status = o.status
from public.orders o
where oi.order_id = o.id;

create or replace function public.sync_order_status_from_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order_id uuid := coalesce(new.order_id, old.order_id);
  computed_status order_status;
begin
  select case min(
    case status
      when 'placed' then 0
      when 'preparing' then 1
      when 'ready' then 2
      when 'served' then 3
    end
  )
    when 0 then 'placed'
    when 1 then 'preparing'
    when 2 then 'ready'
    else 'served'
  end
  into computed_status
  from public.order_items
  where order_id = target_order_id;

  if computed_status is not null then
    update public.orders
    set status = computed_status,
        served_at = case when computed_status = 'served' then coalesce(served_at, now()) else null end
    where id = target_order_id
      and status is distinct from computed_status;
  end if;

  return null;
end;
$$;

create trigger order_items_sync_order_status
  after insert or update of status on public.order_items
  for each row
  execute function public.sync_order_status_from_items();

-- Realtime: order_items was previously read once per page load / order
-- event and never watched live (see 0005_realtime.sql). Per-item status
-- now needs to reach every admin device watching the live board.
alter publication supabase_realtime add table public.order_items;
