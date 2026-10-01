-- OPA Bar & Cafe — QR table ordering
-- 0010_service_requests.sql: "Call Waiter" / "Request Bill" table-side alerts

create type service_request_type as enum ('call_waiter', 'request_bill');
create type service_request_status as enum ('pending', 'acknowledged');

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  type service_request_type not null,
  status service_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

create index service_requests_table_id_idx on public.service_requests(table_id);
create index service_requests_status_idx on public.service_requests(status);

alter table public.service_requests enable row level security;

-- Same practical (not cryptographic) trust model as orders/cart_items in
-- 0002_rls.sql and 0008_shared_cart_and_feedback.sql: no customer auth
-- exists, so this is scoped by knowing the table's QR/number, not a signed
-- session.
create policy "anon can create service requests for active tables"
  on public.service_requests for insert
  to anon
  with check (
    exists (select 1 from public.tables t where t.id = table_id and t.is_active = true)
  );

create policy "anon can read service requests"
  on public.service_requests for select
  to anon
  using (true);

create policy "admins manage service requests"
  on public.service_requests for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE events aren't used for this table (requests are resolved via an
-- UPDATE to status='acknowledged', never deleted), so the replica-identity
-- gotcha fixed in 0009 for cart_items doesn't apply here — the realtime
-- filter only ever needs to match INSERT/UPDATE's NEW row, which always
-- carries every column regardless of replica identity.
alter publication supabase_realtime add table public.service_requests;
