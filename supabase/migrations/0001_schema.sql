-- OPA Bar & Cafe — QR table ordering
-- 0001_schema.sql: core tables, enums, indexes

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────

create type order_status as enum ('placed', 'preparing', 'ready', 'served');
create type admin_role as enum ('manager', 'kitchen');
-- Food dietary tag. Drinks use is_alcoholic instead (the veg/non-veg
-- distinction doesn't apply to them in the source menu).
create type dietary_type as enum ('veg', 'non_veg', 'egg', 'seafood');

-- ── Tables ───────────────────────────────────────────────────────────────

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  table_number int not null unique,
  qr_code_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Groups categories under a section header in the customer nav
  -- (e.g. "Food", "Bar", "Barista", "Desserts").
  section text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  -- Display / "from" price. For items with variants this equals the
  -- cheapest variant's price; order pricing always comes from
  -- price_at_order on the order line, not this column.
  price numeric(10,2) not null,
  image_url text,
  dietary_type dietary_type,
  is_alcoholic boolean not null default false,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Serving-size price variants (e.g. Peg / Bottle, Glass / Bottle,
-- Single Shot / Shots of 6 / Shots of 12). Most food items and simple
-- drinks have none; the customer just orders at menu_items.price.
create table public.menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  label text not null,
  price numeric(10,2) not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id),
  status order_status not null default 'placed',
  created_at timestamptz not null default now(),
  served_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  variant_id uuid references public.menu_item_variants(id),
  quantity int not null check (quantity > 0),
  notes text,
  price_at_order numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- One row per admin/kitchen login. id must match a Supabase Auth user id
-- (auth.users.id) — see README for how to create the first admin.
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role admin_role not null default 'manager',
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────

create index menu_items_category_id_idx on public.menu_items(category_id);
create index menu_item_variants_menu_item_id_idx on public.menu_item_variants(menu_item_id);
create index orders_table_id_idx on public.orders(table_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at);
create index order_items_order_id_idx on public.order_items(order_id);
