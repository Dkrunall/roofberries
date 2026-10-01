-- Roofberries Cocktail Bar — QR table ordering
-- 0003_seed_tables.sql: starter set of 20 dining tables so the
-- customer flow (/order?table=N) works before the admin QR tool adds more.

insert into public.tables (table_number, is_active) values
  (1, true),
  (2, true),
  (3, true),
  (4, true),
  (5, true),
  (6, true),
  (7, true),
  (8, true),
  (9, true),
  (10, true),
  (11, true),
  (12, true),
  (13, true),
  (14, true),
  (15, true),
  (16, true),
  (17, true),
  (18, true),
  (19, true),
  (20, true)
on conflict (table_number) do nothing;
