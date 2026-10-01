'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { MenuItem, MenuSection } from '@/types/menu';
import { OrderFrame, OrderHeader } from './OrderShell';
import { MenuItemRow } from './MenuItemRow';
import { HeroVideoHeader } from './HeroVideoHeader';
import { MainCategoryCards } from './MainCategoryCards';
import { SubcategoryRail } from './SubcategoryRail';
import { VegDietFilter } from './VegDietFilter';
import { DEFAULT_LABEL_FILTERS, LabelFilterModal, isLabelFilterActive, type LabelFilters } from './LabelFilterModal';
import type { DietFilter } from './dietFilter';
import { formatPrice } from '@/lib/format';
import { isValidImageSrc } from '@/lib/imageUrl';
import { CloseIcon, PlateIcon, SearchIcon } from '@/components/icons';

function itemMatchesFilter(item: MenuItem, filter: DietFilter): boolean {
  if (filter === 'all') return true;
  // An untagged item (dietary_type never set in the admin) is of *unknown*
  // type, not "matches everything" — showing it under "Veg" could put an
  // actually non-veg dish in front of a vegetarian guest relying on the
  // filter. Only 'all' shows untagged items; both specific filters hide
  // them until the data gap is fixed.
  if (item.dietaryType === null) return false;
  if (filter === 'veg') return item.dietaryType === 'veg';
  return item.dietaryType === 'non_veg' || item.dietaryType === 'egg' || item.dietaryType === 'seafood';
}

function itemMatchesLabelFilters(item: MenuItem, filters: LabelFilters): boolean {
  if (filters.nonVegOnly && !(item.dietaryType === 'non_veg' || item.dietaryType === 'egg' || item.dietaryType === 'seafood')) {
    return false;
  }
  if (filters.nonAlcoholicOnly && item.isAlcoholic) return false;
  if (filters.excludedAllergens.length > 0 && item.allergens.some((a) => filters.excludedAllergens.includes(a))) {
    return false;
  }
  return true;
}

export function MenuBrowser({
  tableNumber,
  sections,
}: {
  tableNumber: number;
  sections: MenuSection[];
}) {
  // Two screens: main-category picker, and a section screen (subcategory
  // rail + that subcategory's items shown side by side, mirroring Zillout).
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  // The rail's explicit selection, if any — falls back to the section's
  // first subcategory (see activeCategory below) whenever this doesn't
  // match one still showing items, so switching sections/filters never
  // leaves the rail with nothing selected.
  const [explicitCategoryId, setExplicitCategoryId] = useState<string | null>(null);
  const [dietFilter, setDietFilter] = useState<DietFilter>('all');
  const [labelFilters, setLabelFilters] = useState<LabelFilters>(DEFAULT_LABEL_FILTERS);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Flat list of matching items (not grouped into category cards) so search
  // renders as a lightweight suggestions dropdown right under the search
  // bar instead of a whole results screen the customer had to scroll past
  // the hero video to reach.
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const results: { item: MenuItem; sectionName: string; categoryId: string; categoryName: string }[] = [];
    for (const section of sections) {
      for (const cat of section.categories) {
        for (const item of cat.items) {
          if (!itemMatchesFilter(item, dietFilter)) continue;
          if (!itemMatchesLabelFilters(item, labelFilters)) continue;
          const matchesQuery = item.name.toLowerCase().includes(query) || (item.description ?? '').toLowerCase().includes(query);
          if (!matchesQuery) continue;
          results.push({ item, sectionName: section.section, categoryId: cat.id, categoryName: cat.name });
        }
      }
    }
    return results;
  }, [sections, dietFilter, labelFilters, searchQuery]);

  // The section screen keeps every subcategory in its rail even when a
  // filter leaves some (or all) of them with zero matching items — unlike
  // the top-level picker and search results, which drop empty entries.
  // Otherwise applying a filter that empties the active category (e.g.
  // "Non Alcoholic Only" inside a section that's 100% alcoholic) would
  // make the section itself vanish from baseFilteredSections and silently
  // bounce the customer back to the picker with no explanation.
  const currentSection = useMemo(() => {
    const raw = sections.find((s) => s.section === selectedSection);
    if (!raw) return null;
    const query = searchQuery.trim().toLowerCase();
    return {
      section: raw.section,
      categories: raw.categories.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          const matchesDiet = itemMatchesFilter(item, dietFilter);
          const matchesLabels = itemMatchesLabelFilters(item, labelFilters);
          const matchesQuery = query === '' || item.name.toLowerCase().includes(query) || (item.description && item.description.toLowerCase().includes(query));
          return matchesDiet && matchesLabels && matchesQuery;
        }),
      })),
    };
  }, [sections, selectedSection, dietFilter, labelFilters, searchQuery]);

  const activeCategory = useMemo(() => {
    if (!currentSection) return null;
    const explicit = currentSection.categories.find((c) => c.id === explicitCategoryId);
    return explicit ?? currentSection.categories[0] ?? null;
  }, [currentSection, explicitCategoryId]);

  function openSection(section: string, categoryId?: string) {
    setSelectedSection(section);
    setExplicitCategoryId(categoryId ?? null);
    // Tapping a category card — including from search results — means
    // "take me there now". Without clearing the query, isSearching stays
    // true and the section screen below never renders: the render guard
    // falls through to the top-level search-results screen forever, so
    // search-result taps looked like they did nothing.
    setSearchQuery('');
    setIsSearchOpen(false);
  }

  const isSearching = searchQuery.trim().length > 0;

  // ── Section screen: subcategory rail + active subcategory's items ─────
  if (currentSection && !isSearching) {
    return (
      <OrderFrame tableNumber={tableNumber}>
        <OrderHeader
          tableNumber={tableNumber}
          title={currentSection.section}
          onBack={() => setSelectedSection(null)}
          dietFilter={dietFilter}
          onDietFilterChange={setDietFilter}
          onOpenFilters={() => setIsFilterModalOpen(true)}
          filterActive={isLabelFilterActive(labelFilters)}
        />

        <main className="flex-1 flex gap-2.5 sm:gap-3.5 px-3 sm:px-4 pt-2 pb-6">
          <SubcategoryRail
            categories={currentSection.categories}
            activeCategoryId={activeCategory?.id ?? null}
            onSelect={setExplicitCategoryId}
          />

          <div className="min-w-0 flex-1 space-y-3">
            {!activeCategory || activeCategory.items.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-white/10 bg-[#121215]">
                <p className="text-zinc-400 text-sm font-medium">No items match your filter.</p>
              </div>
            ) : (
              activeCategory.items.map((item) => (
                <MenuItemRow key={item.id} item={item} categoryName={activeCategory.name} />
              ))
            )}
          </div>
        </main>

        {isFilterModalOpen ? (
          <LabelFilterModal
            value={labelFilters}
            onApply={setLabelFilters}
            onClose={() => setIsFilterModalOpen(false)}
          />
        ) : null}
      </OrderFrame>
    );
  }

  // ── Top-level: pick a main category (or view search results) ───────────
  return (
    <OrderFrame tableNumber={tableNumber}>
      <HeroVideoHeader tableNumber={tableNumber}>
        <OrderHeader
          tableNumber={tableNumber}
          dietFilter={dietFilter}
          onDietFilterChange={setDietFilter}
          isSearchOpen={isSearchOpen}
          onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        />

        {isSearchOpen ? (
          <div className="relative mx-3 mt-1.5 mb-2 px-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, cocktails, desserts..."
                className="w-full rounded-2xl border border-white/15 bg-black/90 px-4 py-3 pl-11 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 backdrop-blur-md shadow-2xl"
                autoFocus
              />
              <SearchIcon className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:text-white active:scale-90 cursor-pointer"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              ) : null}
            </div>

            {isSearching ? (
              <div className="absolute inset-x-0 top-full mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#121215]/98 backdrop-blur-2xl shadow-2xl">
                {searchResults.length === 0 ? (
                  <p className="p-5 text-center text-xs sm:text-sm font-medium text-zinc-400">
                    No items found matching &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  searchResults.map(({ item, sectionName, categoryId, categoryName }) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openSection(sectionName, categoryId)}
                      className="flex w-full items-center gap-3 border-b border-white/5 p-3.5 text-left last:border-0 hover:bg-white/5 active:bg-white/10 cursor-pointer"
                    >
                      {isValidImageSrc(item.imageUrl) ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                          <Image src={item.imageUrl} alt={item.name} fill sizes="48px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-zinc-900">
                          <PlateIcon className="h-5 w-5 text-zinc-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm sm:text-base font-bold text-zinc-100">{item.name}</p>
                        <p className="truncate text-xs font-semibold text-zinc-400">{categoryName}</p>
                      </div>
                      <span className="shrink-0 text-xs sm:text-sm font-extrabold text-amber-400">
                        {item.variants.length > 0
                          ? `From ${formatPrice(Math.min(...item.variants.map((v) => v.price)))}`
                          : formatPrice(item.price)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </HeroVideoHeader>

      {/* Dims background when search open */}
      {isSearchOpen && isSearching ? (
        <div
          className="fixed inset-0 z-30 bg-black/75 backdrop-blur-sm"
          onClick={() => {
            setSearchQuery('');
            setIsSearchOpen(false);
          }}
        />
      ) : null}

      <div className="px-4 pt-2 pb-8 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Categories</p>
          <span className="text-[11px] font-semibold text-zinc-500">{sections.length} Sections</span>
        </div>
        <MainCategoryCards sections={sections} onSelect={(section) => openSection(section)} />
      </div>
    </OrderFrame>
  );
}
