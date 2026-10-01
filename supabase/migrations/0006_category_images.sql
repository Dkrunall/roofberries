-- OPA Bar & Cafe — QR table ordering
-- 0006_category_images.sql: adds a representative photo per subcategory
-- (Whiskey, Vodka, Cold Mezze, ...), used by the category browse cards.
-- Sourced from Zillout's shared category-icon library (matched by
-- subcategory name), separate from menu_items.image_url which is
-- per-dish/per-drink photography.

alter table public.categories add column image_url text;
