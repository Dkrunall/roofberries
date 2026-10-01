import type { DietaryType } from './database';

export interface MenuItemVariant {
  id: string;
  label: string;
  price: number;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  dietaryType: DietaryType | null;
  isAlcoholic: boolean;
  isAvailable: boolean;
  sortOrder: number;
  variants: MenuItemVariant[];
  /** Parsed from the description's "Contains: ..." suffix — see lib/allergens.ts. */
  allergens: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  section: string;
  sortOrder: number;
  /** Representative photo for this subcategory (Whiskey, Cold Mezze, ...),
   *  distinct from any individual dish/drink's own image. */
  imageUrl: string | null;
  items: MenuItem[];
}

/** Categories grouped under their section header, in display order. */
export interface MenuSection {
  section: string;
  categories: MenuCategory[];
}
