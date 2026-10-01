'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MenuItem, MenuSection } from '@/types/menu';
import { OrderFrame } from './OrderShell';
import { MenuItemRow } from './MenuItemRow';
import { MainCategoryCards } from './MainCategoryCards';
import { DEFAULT_LABEL_FILTERS, LabelFilterModal, isLabelFilterActive, type LabelFilters } from './LabelFilterModal';
import type { DietFilter } from './dietFilter';
import { SearchIcon } from '@/components/icons';
import { BRAND } from '@/lib/brand';
import styles from './Terrace.module.css';

function matches(item: MenuItem, diet: DietFilter, filters: LabelFilters, query: string) {
  if (diet === 'veg' && item.dietaryType !== 'veg') return false;
  const nonVeg = item.dietaryType === 'non_veg' || item.dietaryType === 'egg' || item.dietaryType === 'seafood';
  if ((diet === 'non_veg' || filters.nonVegOnly) && !nonVeg) return false;
  if (filters.nonAlcoholicOnly && item.isAlcoholic) return false;
  if (item.allergens.some((allergen) => filters.excludedAllergens.includes(allergen))) return false;
  return !query || `${item.name} ${item.description ?? ''}`.toLowerCase().includes(query);
}

export function MenuBrowser({ tableNumber, sections }: { tableNumber: number; sections: MenuSection[] }) {
  const [section, setSection] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [diet, setDiet] = useState<DietFilter>('all');
  const [filters, setFilters] = useState<LabelFilters>(DEFAULT_LABEL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const query = search.trim().toLowerCase();
  const current = sections.find((entry) => entry.section === section);
  const activeCategory = current?.categories.find((entry) => entry.id === category) ?? current?.categories[0];
  const groups = query
    ? (current ? [current] : sections).flatMap((entry) => entry.categories)
    : activeCategory ? [activeCategory] : [];
  const visible = groups.map((entry) => ({ ...entry, items: entry.items.filter((item) => matches(item, diet, filters, query)) })).filter((entry) => entry.items.length);
  const filtered = Boolean(query || diet !== 'all' || isLabelFilterActive(filters));

  function openSection(name: string | null) {
    setSection(name);
    setCategory(null);
    setSearch('');
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      titleRef.current?.focus({ preventScroll: true });
    });
  }

  function clearFilters() {
    setSearch(''); setDiet('all'); setFilters(DEFAULT_LABEL_FILTERS);
  }

  return (
    <OrderFrame tableNumber={tableNumber} wide>
      <div className={`${styles.site} ${styles.simpleMenu}`}>
        <header className={styles.simpleNav}>
          {current ? <button type="button" className={styles.backButton} onClick={() => openSection(null)} aria-label="Back to categories">←</button> : <Link href="/" className={styles.wordmark}>{BRAND.shortName}</Link>}
          {current ? <h1 ref={titleRef} tabIndex={-1}>{current.section}</h1> : null}
          <div className={styles.navActions}><Link href={`/order/status?table=${tableNumber}`} className={styles.navLink}>Orders</Link><span className={styles.tableBadge}>Table {tableNumber}</span></div>
        </header>

        {!current ? <section className={styles.compactHero}>
          <Image src={BRAND.heroImage} alt="Roofberries terrace" fill sizes="(min-width: 900px) 900px, 100vw" priority className={styles.venueImage} />
          <div className={styles.venueShade} />
          <div className={styles.compactHeroContent}><Image src={BRAND.logo} alt="" width={56} height={56} className={styles.heroLogo} /><div><h1>{BRAND.shortName}</h1><p>Cocktail & Terrace Bar</p></div></div>
        </section> : null}

        <main className={styles.simpleMain}>
          <div className={styles.simpleControls}>
            <div className={styles.search}><SearchIcon aria-hidden="true" /><input aria-label="Search menu" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={current ? `Search ${current.section.toLowerCase()}…` : 'Search the menu…'} /></div>
            <div className={styles.dietControls}>
              <div className={styles.dietToggle} role="group" aria-label="Diet preference">
                {(['all', 'veg', 'non_veg'] as const).map((value) => (
                  <button key={value} type="button" aria-pressed={diet === value} data-diet={value} onClick={() => { setDiet(value); setFilters((previous) => ({ ...previous, nonVegOnly: false })); }}>
                    {value !== 'all' ? <span aria-hidden="true" className={styles.dietDot} /> : null}
                    {value === 'all' ? 'All' : value === 'veg' ? 'Veg' : 'Non-veg'}
                  </button>
                ))}
              </div>
              <div className={styles.filters}>
              <button type="button" onClick={() => setFilterOpen(true)} className={isLabelFilterActive(filters) ? styles.filterActive : ''}>Filters {isLabelFilterActive(filters) ? '•' : '+'}</button>
              </div>
            </div>
          </div>

          {current && !query ? <nav className={styles.subcategoryPills} aria-label="Subcategories">
            {current.categories.map((entry) => <button key={entry.id} type="button" aria-pressed={activeCategory?.id === entry.id} onClick={(event) => { setCategory(entry.id); event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }}>{entry.name}</button>)}
          </nav> : null}

          {!current && !query ? <>
            <h2 ref={titleRef} tabIndex={-1} className={styles.simpleTitle}>Categories</h2>
            {sections.length ? <MainCategoryCards sections={sections} onSelect={openSection} /> : <p className={styles.shortEmpty}>Menu coming soon. Please ask your server.</p>}
          </> : <>
            <div className={styles.simpleResultTitle}><h2>{query ? 'Search results' : activeCategory?.name ?? 'Menu'}</h2>{filtered ? <button type="button" onClick={clearFilters}>Clear filters</button> : null}</div>
            <p className="sr-only" role="status">{visible.reduce((sum, entry) => sum + entry.items.length, 0)} items</p>
            {visible.length ? visible.map((entry) => <section key={entry.id} className={styles.simpleGroup}>
              {query ? <h3>{entry.name}</h3> : null}
              <div className={styles.itemGrid}>{entry.items.map((item) => <MenuItemRow key={item.id} item={item} categoryName={entry.name} />)}</div>
            </section>) : <div className={styles.shortEmpty}><p>No items found.</p>{filtered ? <button type="button" onClick={clearFilters}>Clear filters</button> : null}</div>}
          </>}
        </main>
      </div>
      {filterOpen ? <LabelFilterModal value={filters} onApply={(next) => { if (next.nonVegOnly) setDiet('non_veg'); setFilters({ ...next, nonVegOnly: false }); }} onClose={() => setFilterOpen(false)} /> : null}
    </OrderFrame>
  );
}
