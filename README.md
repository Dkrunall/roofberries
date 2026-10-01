# Roofberries Cocktail Bar — QR Table Ordering

Forked from the OPA Bar & Cafe app. Runs as its own deployment with its own
Supabase project — never point this at the OPA database. Branding lives in
`src/lib/brand.ts` (name, logo, hero photo) and `src/app/globals.css` (colors).

Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, Realtime) + Tailwind CSS.

## 1. Create your Supabase project

1. Go to https://supabase.com/dashboard → New project.
2. Once it's provisioned, open **Project Settings → API** and copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this one secret — server-only)
3. Copy `.env.local.example` to `.env.local` and fill in the three values.

```bash
cp .env.local.example .env.local
```

## 2. Run the database migrations

**Quickest:** paste the whole of `supabase/roofberries_full_setup.sql` into the SQL Editor and click Run once — it is migrations 0001–0013 combined in one transaction. Or run the individual files below in order:

Open your Supabase project's **SQL Editor** and run these files **in order** (each is meant to run once against a fresh project):

1. `supabase/migrations/0001_schema.sql` — tables, enums, indexes
2. `supabase/migrations/0002_rls.sql` — row level security policies
3. `supabase/migrations/0003_seed_tables.sql` — 20 starter dining tables (1–20)
4. `supabase/migrations/0004_seed_menu.sql` — the full Roofberries menu (56 categories, 350 items, 296 price variants), extracted from the venue's Zillout menu (pubId 969)
5. `supabase/migrations/0005_realtime.sql` — turns on Realtime for the `orders` table (powers the live customer status screen and admin dashboard)
6. `supabase/migrations/0006_category_images.sql` — adds `categories.image_url`
7. `supabase/migrations/0007_seed_category_images.sql` — populates it for 33 of 56 categories, using the first item photo in each

Paste each file's contents into the SQL Editor and click Run, in that order.

> If you'd rather use the Supabase CLI (`supabase link` + `supabase db push`) instead of the SQL Editor, these files are already laid out as CLI-compatible migrations — that works too.

## 3. Create your first admin login

The app has no self-serve sign-up (by design — see the RLS notes in `0002_rls.sql`). Create the first manager account with:

```bash
npm run create-admin -- owner@roofberries.com "a-strong-password" manager
```

(role is `manager` or `kitchen`; run it again with a different email for more logins)

## 4. Install & run

```bash
npm install
npm run dev
```

- Customer flow: http://localhost:3000/order?table=1
- Admin login: http://localhost:3000/admin/login

## 5. (Optional) Enable Web Push notifications

The app works fully without this — "order ready" alerts fall back to the
in-tab Notification API (only fires while a tab is open). Web Push also
reaches the customer's device with the tab/browser fully closed, and is
what makes the "Add to Home Screen" install worth having.

1. Run `supabase/migrations/0013_push_subscriptions.sql` (after the rest —
   it depends on `orders`).
2. Generate a VAPID key pair: `npx web-push generate-vapid-keys`.
3. Add both to `.env.local` (and to your Vercel project's env vars for
   production):
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   ```
4. If you ever swap out `public/roofberries-logo.jpg`, regenerate the PWA icon set
   with `node scripts/generate-pwa-icons.js`.

## Project structure

```
supabase/migrations/     SQL schema, RLS policies, seed data (run via SQL Editor)
scripts/
  generate-seed-sql.js   Regenerates 0003/0004/0007 from scripts/roofberries_menu_raw.json
  roofberries_menu_raw.json  Raw getFullMenu2 extract from Zillout (pubId 969)
  create-admin.js        Creates a Supabase Auth user + admin_users row
  generate-pwa-icons.js  Regenerates public/icons/* from public/roofberries-logo.jpg
public/sw.js             Service worker — Web Push + install (see README §5)
src/
  app/                   Next.js App Router routes
  app/manifest.ts        PWA web app manifest
  lib/supabase/          Browser / server / middleware Supabase clients
  lib/push/              Web Push send/subscribe helpers
  types/database.ts      Hand-written TS types matching the SQL schema
```

## Data model notes (deviations from a bare veg/non-veg + single-price model)

- **`menu_item_variants`** — many drinks (spirits, wine, beer, shots) sell by multiple serving sizes (Peg/Bottle, Glass/Bottle, Single Shot/Tray of 6/Tray of 12). `menu_items.price` is the "from" price for the list view; ordering a variant-bearing item always resolves to a specific `menu_item_variants` row, and `order_items.price_at_order` is captured from whichever was chosen.
- **`dietary_type` + `is_alcoholic`** — the source menu tags items as `veg` / `non_veg` / `egg` / `seafood` / `alcoholic` / `non-alcoholic`, not a plain boolean. Food items get a `dietary_type`; drinks get `is_alcoholic` instead (dietary_type is null for them).
- **Anonymous order visibility** — there's no customer login, so "customers can only read their own table's order" is enforced practically (unguessable UUID order ids, no PII ever stored) rather than via a true per-user RLS scope. See the comment above the `orders` policies in `0002_rls.sql` if you need to harden this later (e.g. a signed per-order token).
