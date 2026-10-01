// Generates the Roofberries seed migrations from scripts/roofberries_menu_raw.json
// (raw extract from Zillout's getFullMenu2 API, pubId=969):
//   0003_seed_tables.sql           starter dining tables
//   0004_seed_menu.sql             categories, menu items, price variants
//   0007_seed_category_images.sql  categories.image_url (column added in 0006)
//
// Refresh the raw menu, then regenerate:
//   curl -s -H "Origin: https://zillout.com" \
//     "https://api.zillout.com/api/v1/rbzo/pubs/menu/getFullMenu2?pubId=969&vegOnly=false&nonAlcoholic=false&areaName=" \
//     -o scripts/roofberries_menu_raw.json
//   node scripts/generate-seed-sql.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC = path.join(__dirname, 'roofberries_menu_raw.json');
const MIGRATIONS = path.join(__dirname, '..', 'supabase', 'migrations');
const OUT_TABLES = path.join(MIGRATIONS, '0003_seed_tables.sql');
const OUT_MENU = path.join(MIGRATIONS, '0004_seed_menu.sql');
const OUT_CATEGORY_IMAGES = path.join(MIGRATIONS, '0007_seed_category_images.sql');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8')).data;

// Customer-facing sections, in display order. Each entry pulls one Zillout
// (section, subCategory) pair into a category with a cleaned-up name.
// Zillout's "chefRecommend" and "customCategories" buckets only duplicate
// items listed elsewhere, so they're intentionally not mapped.
const SECTIONS = [
  [
    'Cocktails',
    [
      ['drinks', 'COCKTAILS', 'Cocktails'],
      ['cocktail jelly', 'COCKTAIL JELLY', 'Cocktail Jelly'],
      ['picantes festival', 'PICANTES FESTIVAL', 'Picantes Festival'],
    ],
  ],
  [
    'Food',
    [
      ['food', 'TAPAS', 'Tapas'],
      ['food', 'SALADS', 'Salads'],
      ['food', 'HEALTHY TALK', 'Healthy Talk'],
      ['food', 'SUSHI', 'Sushi'],
      ['food', 'DIMSUM', 'Dimsum'],
      ['food', 'BIG PLATES VEG', 'Big Plates — Veg'],
      ['food', 'BIG PLATES NON-VEG', 'Big Plates — Non-Veg'],
      ['food', 'SOURDOUGH HAND TOSS PIZZA', 'Sourdough Pizza'],
      ['food', 'ROOFBERRIES JAPANESE MILKY BREAD SANDWICHES', 'Japanese Milk Bread Sandwiches'],
      ['food', 'MAINS', 'Mains'],
      ['food', 'RICE/NOODLES AND EXTRAS', 'Rice, Noodles & Extras'],
    ],
  ],
  [
    "Chef's Curated",
    [
      ['chef curated food menu', 'SMALL PLATES', 'Small Plates'],
      ['chef curated food menu', 'MAIN COURSE', 'Main Course'],
      ['chef curated food menu', 'DESSERT', 'Desserts'],
    ],
  ],
  [
    'Bar',
    [
      ['drinks', 'SINGLE MALT', 'Single Malt'],
      ['drinks', 'BLENDED SCOTCH', 'Blended Scotch'],
      ['drinks', 'JAPANESE WHISKY', 'Japanese Whisky'],
      ['drinks', 'AMERICAN / BOURBON WHISKY', 'American / Bourbon Whisky'],
      ['drinks', 'VODKA', 'Vodka'],
      ['drinks', 'GIN', 'Gin'],
      ['drinks', 'RUM', 'Rum'],
      ['drinks', 'TEQUILA', 'Tequila'],
      ['drinks', 'BRANDY AND COGNAC', 'Brandy & Cognac'],
      ['drinks', 'APERITIFS', 'Aperitifs'],
      ['drinks', 'DIGESTIFS', 'Digestifs'],
      ['drinks', 'SHOTS', 'Shots'],
      ['drinks', 'BEER', 'Beer'],
      ['drinks', 'BREZZERS', 'Breezers'],
      ['drinks', 'SPARKLING WINE AND CHAMPAGNE', 'Sparkling Wine & Champagne'],
      ['drinks', 'WHITE WINE', 'White Wine'],
      ['drinks', 'ROSÉ WINE', 'Rosé Wine'],
      ['drinks', 'RED WINE', 'Red Wine'],
    ],
  ],
  [
    'Beverages',
    [
      ['drinks', 'SPIRITLESS ELIXIRS', 'Spiritless Elixirs'],
      ['beverages', 'BEVERAGE', 'Soft Drinks & Water'],
      ['beverages', 'ENERGY ZONE', 'Energy Zone'],
    ],
  ],
  [
    'Barista',
    [
      ['barista menu', 'ESPRESSO RITUALS', 'Espresso Rituals'],
      ['barista menu', 'BREW & CHILL', 'Brew & Chill'],
      ['barista menu', 'CHILLED', 'Chilled'],
      ['barista menu', 'ALL THINGS MATCHA', 'All Things Matcha'],
      ['barista menu', 'GREEN STATE OF MIND', 'Green State of Mind'],
      ['barista menu', 'COCOA & COMFORT', 'Cocoa & Comfort'],
      ['barista menu', 'HOUSE FAVOURITES', 'House Favourites'],
      ['barista menu', 'MILKSHAKES', 'Milkshakes'],
      ['barista menu', 'YOUR KIND OF MILK', 'Your Kind of Milk'],
      ['barista menu', 'A LITTLE EXTRA', 'A Little Extra'],
    ],
  ],
  [
    'Jain Menu',
    [
      ['jain menu', 'SALAD', 'Jain Salad'],
      ['jain menu', 'SUSHI', 'Jain Sushi'],
      ['jain menu', 'DIMSUM', 'Jain Dimsum'],
      ['jain menu', 'TAPAS', 'Jain Tapas'],
      ['jain menu', 'BIG PLATES VEG', 'Jain Big Plates'],
      ['jain menu', 'SOURDOUGH HAND TOSSED PIZZA', 'Jain Sourdough Pizza'],
      ['jain menu', 'MAINS', 'Jain Mains'],
      ['jain menu', 'RICE / NOODLES', 'Jain Rice & Noodles'],
    ],
  ],
];

// Zillout size keys -> display labels.
const VARIANT_LABEL_MAP = {
  BOTTLE: 'Bottle',
  GLASS: 'Glass',
  PINT: 'Pint',
  CAN: 'Can',
  '30ML': '30ml',
  '330ML': '330ml',
  '500ML': '500ml',
  '750ML': '750ml',
  '4 PCS': '4 pcs',
  '4PCS': '4 pcs',
  '6 PCS': '6 pcs',
  '8 PCS': '8 pcs',
  '8PCS': '8 pcs',
};

const TYPE_MAP = {
  veg: { dietary_type: 'veg', is_alcoholic: false },
  'non-veg': { dietary_type: 'non_veg', is_alcoholic: false },
  egg: { dietary_type: 'egg', is_alcoholic: false },
  seafood: { dietary_type: 'seafood', is_alcoholic: false },
  alcoholic: { dietary_type: null, is_alcoholic: true },
  'non-alcoholic': { dietary_type: null, is_alcoholic: false },
};

// Zillout's free-text allergen labels -> the vocabulary in src/lib/allergens.ts.
// "FISHDAIRY PRODUCT" is a source typo for "FISH, DAIRY PRODUCT".
const ALLERGEN_MAP = {
  GLUTEN: ['Gluten'],
  'DAIRY PRODUCT': ['Milk'],
  'DAIRY PRODUCTS': ['Milk'],
  DAIRY: ['Milk'],
  FISH: ['Fish'],
  'FISHDAIRY PRODUCT': ['Fish', 'Milk'],
  EGG: ['Eggs'],
  NUTS: ['Nuts'],
  SESAME: ['Sesame'],
  SOY: ['Soy'],
  SHELLFISH: ['Shellfish'],
  MUSHROOM: ['Mushroom'],
};

function sqlStr(v) {
  if (v === null || v === undefined) return 'null';
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlBool(v) {
  return v ? 'true' : 'false';
}
function sqlNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? String(n) : 'null';
}
function titleCase(s) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Serving-size / choice variants. Zillout puts real choices (Plain / Butter,
 *  Chicken / Prawns) in `options` — those items have price 0 — and sizes
 *  (30ml / Bottle) in `quantity`. A lone `{"1": price}` quantity is just the
 *  base price restated, not a choice. */
function extractVariants(item) {
  const options = item.options && typeof item.options === 'object' ? item.options : {};
  const quantity = item.quantity && typeof item.quantity === 'object' ? item.quantity : {};
  let entries;
  let labelFor;
  if (Object.keys(options).length) {
    entries = Object.entries(options);
    labelFor = titleCase;
  } else {
    entries = Object.entries(quantity).filter(([k]) => k !== '1');
    labelFor = (k) => VARIANT_LABEL_MAP[k] || titleCase(k);
  }
  return entries
    .map(([k, p]) => ({ label: labelFor(k.trim()), price: parseFloat(p) }))
    .filter((v) => Number.isFinite(v.price) && v.price > 0)
    .sort((a, b) => a.price - b.price);
}

function allergensFor(labels) {
  const out = [];
  for (const part of (labels || '').split(',').map((s) => s.trim().toUpperCase())) {
    for (const a of ALLERGEN_MAP[part] || []) if (!out.includes(a)) out.push(a);
  }
  return out;
}

const categoryRows = [];
const itemRows = [];
const variantRows = [];
const mapped = new Set();
let categorySort = 0;

for (const [sectionName, cats] of SECTIONS) {
  for (const [srcSection, srcSub, catName] of cats) {
    const items = raw[srcSection]?.[srcSub];
    if (!Array.isArray(items) || !items.length) {
      console.warn(`skipping missing/empty category: ${srcSection} / ${srcSub}`);
      continue;
    }
    mapped.add(`${srcSection}\u0000${srcSub}`);

    const categoryId = crypto.randomUUID();
    const categoryImage = items.find((i) => i.image)?.image || null;
    categoryRows.push({ id: categoryId, name: catName, section: sectionName, sort_order: categorySort++, image_url: categoryImage });

    const sorted = [...items].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    let itemSort = 0;
    for (const item of sorted) {
      const itemId = crypto.randomUUID();
      const typeInfo = TYPE_MAP[item.type] || { dietary_type: null, is_alcoholic: false };
      const variants = extractVariants(item);
      const basePrice = parseFloat(item.price);
      const price = Number.isFinite(basePrice) && basePrice > 0 ? basePrice : variants[0]?.price ?? 0;

      let description = (item.description || '').trim();
      const allergens = allergensFor(item.labels);
      if (allergens.length) {
        const note = `Contains: ${allergens.join(', ')}`;
        description = description ? `${description} | ${note}` : note;
      }
      if (price <= 0) {
        description = description ? `${description} | Ask your server for pricing` : 'Ask your server for pricing';
      }

      itemRows.push({
        id: itemId,
        category_id: categoryId,
        name: item.name.trim(),
        description: description || null,
        price,
        image_url: item.image || null,
        dietary_type: typeInfo.dietary_type,
        is_alcoholic: typeInfo.is_alcoholic,
        is_available: price > 0 && item.status !== 'OUT_OF_STOCK',
        sort_order: itemSort++,
      });

      variants.forEach((v, idx) => {
        variantRows.push({ id: crypto.randomUUID(), menu_item_id: itemId, label: v.label, price: v.price, sort_order: idx });
      });
    }
  }
}

// Flag any source category the SECTIONS map doesn't cover, so a menu
// refresh that adds a new category doesn't silently drop it.
for (const [srcSection, subs] of Object.entries(raw)) {
  if (srcSection === 'chefRecommend' || srcSection === 'customCategories') continue;
  for (const [srcSub, items] of Object.entries(subs)) {
    if (Array.isArray(items) && items.length && !mapped.has(`${srcSection}\u0000${srcSub}`)) {
      console.warn(`UNMAPPED source category (not seeded): ${srcSection} / ${srcSub} (${items.length} items)`);
    }
  }
}

const HEADER = `-- Roofberries Cocktail Bar — QR table ordering`;

// ── 0003_seed_tables.sql ────────────────────────────────────────────────
const N_TABLES = 20;
let tablesSql = `${HEADER}
-- 0003_seed_tables.sql: starter set of ${N_TABLES} dining tables so the
-- customer flow (/order?table=N) works before the admin QR tool adds more.

insert into public.tables (table_number, is_active) values\n`;
tablesSql += Array.from({ length: N_TABLES }, (_, i) => `  (${i + 1}, true)`).join(',\n');
tablesSql += '\non conflict (table_number) do nothing;\n';
fs.writeFileSync(OUT_TABLES, tablesSql);

// ── 0004_seed_menu.sql ──────────────────────────────────────────────────
let menuSql = `${HEADER}
-- 0004_seed_menu.sql: full menu extracted from the venue's Zillout page
-- (categories, menu items, and serving-size price variants).
-- Generated by scripts/generate-seed-sql.js — do not hand-edit; regenerate
-- from scripts/roofberries_menu_raw.json instead.

insert into public.categories (id, name, section, sort_order) values\n`;
menuSql += categoryRows
  .map((c) => `  (${sqlStr(c.id)}, ${sqlStr(c.name)}, ${sqlStr(c.section)}, ${c.sort_order})`)
  .join(',\n');
menuSql += ';\n\n';

menuSql += `insert into public.menu_items (id, category_id, name, description, price, image_url, dietary_type, is_alcoholic, is_available, sort_order) values\n`;
menuSql += itemRows
  .map(
    (i) =>
      `  (${sqlStr(i.id)}, ${sqlStr(i.category_id)}, ${sqlStr(i.name)}, ${sqlStr(i.description)}, ${sqlNum(
        i.price
      )}, ${sqlStr(i.image_url)}, ${sqlStr(i.dietary_type)}, ${sqlBool(i.is_alcoholic)}, ${sqlBool(
        i.is_available
      )}, ${i.sort_order})`
  )
  .join(',\n');
menuSql += ';\n\n';

if (variantRows.length) {
  menuSql += `insert into public.menu_item_variants (id, menu_item_id, label, price, sort_order) values\n`;
  menuSql += variantRows
    .map((v) => `  (${sqlStr(v.id)}, ${sqlStr(v.menu_item_id)}, ${sqlStr(v.label)}, ${sqlNum(v.price)}, ${v.sort_order})`)
    .join(',\n');
  menuSql += ';\n';
}
fs.writeFileSync(OUT_MENU, menuSql);

// ── 0007_seed_category_images.sql ───────────────────────────────────────
// Each category's card photo is its first item that has one.
let imagesSql = `${HEADER}
-- 0007_seed_category_images.sql: representative photo per category (the
-- first item photo in each), for categories that have any item photo.
-- Generated by scripts/generate-seed-sql.js.\n\n`;
imagesSql += categoryRows
  .filter((c) => c.image_url)
  .map((c) => `update public.categories set image_url = ${sqlStr(c.image_url)} where id = ${sqlStr(c.id)};`)
  .join('\n');
imagesSql += '\n';
fs.writeFileSync(OUT_CATEGORY_IMAGES, imagesSql);

console.log(`categories: ${categoryRows.length} (${categoryRows.filter((c) => c.image_url).length} with images)`);
console.log(`items: ${itemRows.length} (${itemRows.filter((i) => !i.is_available).length} unavailable)`);
console.log(`variants: ${variantRows.length}`);
