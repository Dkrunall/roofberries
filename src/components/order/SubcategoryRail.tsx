'use client';

import Image from 'next/image';
import type { MenuSection } from '@/types/menu';
import { isValidImageSrc } from '@/lib/imageUrl';
import { PlateIcon } from '@/components/icons';

/**
 * Vertical rail of subcategory thumbnails (photo + label), mirroring
 * Zillout's own category sidebar — tapping one switches the item list next
 * to it in place, no navigation to a separate screen.
 */
export function SubcategoryRail({
  categories,
  activeCategoryId,
  onSelect,
}: {
  categories: MenuSection['categories'];
  activeCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <div className="sticky top-[4.5rem] flex max-h-[calc(100vh-6rem)] w-16 sm:w-20 shrink-0 flex-col gap-2.5 overflow-y-auto no-scrollbar pb-6 pt-1">
      {categories.map((cat) => {
        const isActive = cat.id === activeCategoryId;
        const image = [cat.imageUrl, cat.items[0]?.imageUrl].find(isValidImageSrc) ?? null;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="flex shrink-0 flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
          >
            <div
              className={`relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-xl border transition-all duration-300 ${isActive
                  ? 'border-amber-400 bg-zinc-800 shadow-md shadow-amber-500/20 scale-105'
                  : 'border-white/10 bg-zinc-900/80 opacity-70 hover:opacity-100 hover:border-white/20'
                }`}
            >
              {image ? (
                <Image src={image} alt={cat.name} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                  <PlateIcon className="h-5 w-5 text-zinc-500" />
                </div>
              )}
            </div>
            <span
              className={`text-center text-[10px] leading-tight line-clamp-2 px-0.5 ${isActive ? 'font-bold text-amber-300' : 'font-medium text-zinc-400'
                }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
