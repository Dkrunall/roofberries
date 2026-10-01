/**
 * Allergen tags aren't a separate column — they're baked into each item's
 * description as a "... | Contains: Milk, Nuts" suffix (see
 * scripts/generate-seed-sql.js). This extracts that list for filtering
 * without needing a schema change or touching how the description itself
 * is displayed.
 */
export function parseAllergens(description: string | null): string[] {
  if (!description) return [];
  const match = description.match(/Contains:\s*([^|]+)/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The allergens actually present in the seed data (verified against the
 *  live menu, not assumed) — listing an allergen no item ever has would
 *  just be a dead filter option. */
export const KNOWN_ALLERGENS = ['Milk', 'Nuts', 'Gluten', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Sesame', 'Mushroom'] as const;
