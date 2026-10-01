import { createClient } from '@/lib/supabase/server';
import { parseAllergens } from '@/lib/allergens';
import type { MenuCategory, MenuItem, MenuSection } from '@/types/menu';

/**
 * Fetches the full public menu (categories -> items -> variants), grouped
 * by section, in display order. Used by the customer-facing /order route.
 * RLS allows anon to read all of categories/menu_items/menu_item_variants,
 * including unavailable items — the UI is responsible for greying those out
 * rather than hiding them (see 0002_rls.sql).
 */
export async function getMenuSections(): Promise<MenuSection[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select(
      `id, name, section, sort_order, image_url,
       menu_items (
         id, category_id, name, description, price, image_url,
         dietary_type, is_alcoholic, is_available, sort_order,
         menu_item_variants ( id, label, price, sort_order )
       )`
    )
    .order('sort_order', { ascending: true })
    .order('sort_order', { ascending: true, referencedTable: 'menu_items' });

  if (error) throw error;

  const categories: MenuCategory[] = (data ?? []).map((cat) => {
    const items: MenuItem[] = (cat.menu_items ?? [])
      .map((item) => ({
        id: item.id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.image_url,
        dietaryType: item.dietary_type,
        isAlcoholic: item.is_alcoholic,
        isAvailable: item.is_available,
        sortOrder: item.sort_order,
        allergens: parseAllergens(item.description),
        variants: (item.menu_item_variants ?? [])
          .map((v) => ({ id: v.id, label: v.label, price: Number(v.price), sortOrder: v.sort_order }))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      id: cat.id,
      name: cat.name,
      section: cat.section,
      sortOrder: cat.sort_order,
      imageUrl: cat.image_url,
      items,
    };
  });

  const sectionOrder: string[] = [];
  const bySection = new Map<string, MenuCategory[]>();
  for (const cat of categories) {
    if (!bySection.has(cat.section)) {
      bySection.set(cat.section, []);
      sectionOrder.push(cat.section);
    }
    bySection.get(cat.section)!.push(cat);
  }

  return sectionOrder.map((section) => ({ section, categories: bySection.get(section)! }));
}

/** Single category with its items/variants — used by the admin menu editor. */
export async function getCategoryById(categoryId: string): Promise<MenuCategory | null> {
  const supabase = await createClient();

  const { data: cat, error } = await supabase
    .from('categories')
    .select(
      `id, name, section, sort_order, image_url,
       menu_items (
         id, category_id, name, description, price, image_url,
         dietary_type, is_alcoholic, is_available, sort_order,
         menu_item_variants ( id, label, price, sort_order )
       )`
    )
    .eq('id', categoryId)
    .maybeSingle();

  if (error) throw error;
  if (!cat) return null;

  const items: MenuItem[] = (cat.menu_items ?? [])
    .map((item) => ({
      id: item.id,
      categoryId: item.category_id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.image_url,
      dietaryType: item.dietary_type,
      isAlcoholic: item.is_alcoholic,
      isAvailable: item.is_available,
      sortOrder: item.sort_order,
      allergens: parseAllergens(item.description),
      variants: (item.menu_item_variants ?? [])
        .map((v) => ({ id: v.id, label: v.label, price: Number(v.price), sortOrder: v.sort_order }))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: cat.id,
    name: cat.name,
    section: cat.section,
    sortOrder: cat.sort_order,
    imageUrl: cat.image_url,
    items,
  };
}
