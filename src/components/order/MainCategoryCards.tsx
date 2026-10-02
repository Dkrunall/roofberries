'use client';

import Image from 'next/image';
import type { MenuSection } from '@/types/menu';
import {
  BottleIcon,
  CocktailIcon,
  CoffeeCupIcon,
  ForkKnifeIcon,
  MocktailIcon,
  PlateIcon,
} from '@/components/icons';
import { isValidImageSrc } from '@/lib/imageUrl';
import type { ComponentType, SVGProps } from 'react';

const SECTION_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Cocktails: CocktailIcon,
  Food: ForkKnifeIcon,
  "Chef's Curated": PlateIcon,
  Bar: BottleIcon,
  Beverages: MocktailIcon,
  Barista: CoffeeCupIcon,
  'Jain Menu': PlateIcon,
};

/** First available photo within a section, for the card background —
 *  prefers a category's own representative photo over an individual
 *  dish/drink's, since most items don't have one but many categories do. */
function representativeImage(section: MenuSection): string | null {
  const categoryArtwork: Record<string, string> = {
    Beverages: '/categories/beverages.png',
    Barista: '/categories/barista.png',
    'Jain Menu': '/categories/jain-menu.png',
  };
  if (categoryArtwork[section.section]) return categoryArtwork[section.section];
  for (const cat of section.categories) {
    if (isValidImageSrc(cat.imageUrl)) return cat.imageUrl;
  }
  for (const cat of section.categories) {
    for (const item of cat.items) {
      if (isValidImageSrc(item.imageUrl)) return item.imageUrl;
    }
  }
  return null;
}

function totalItemCount(section: MenuSection): number {
  return section.categories.reduce((n, cat) => n + cat.items.length, 0);
}

/** Photo grid with direct access to each section's subcategories. */
export function MainCategoryCards({
  sections,
  onSelect,
}: {
  sections: MenuSection[];
  onSelect: (section: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {sections.map((section) => {
        const image = representativeImage(section);
        const itemCount = totalItemCount(section);
        const SectionIcon = SECTION_ICON[section.section] ?? PlateIcon;
        return (
          <button
            key={section.section}
            type="button"
            onClick={() => onSelect(section.section)}
            className="group relative aspect-[1.08] min-w-0 overflow-hidden rounded-2xl bg-[#352c29] shadow-sm transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
          >
            {image ? (
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 900px) 280px, (min-width: 640px) 30vw, 45vw"
                className="object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <SectionIcon className="h-10 w-10 text-zinc-500" />
              </div>
            )}

            {/* Dark minimal vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

            {/* Minimal label overlay */}
            <div className="relative z-10 flex h-full flex-col justify-end p-3 text-left">
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                {section.section}
              </h3>
              <p className="mt-1 flex items-center justify-between text-[11px] font-medium text-white/80">
                <span>{itemCount} items</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
