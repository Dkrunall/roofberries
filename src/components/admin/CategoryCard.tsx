'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTransition } from 'react';
import { deleteCategory } from '@/lib/actions/menu';
import { isValidImageSrc } from '@/lib/imageUrl';
import { PlateIcon } from '@/components/icons';

export function CategoryCard({
  categoryId,
  name,
  itemCount,
  imageUrl,
}: {
  categoryId: string;
  name: string;
  itemCount: number;
  imageUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!window.confirm(`Delete "${name}" and all ${itemCount} item(s) in it? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteCategory(categoryId);
      } catch (err) {
        window.alert(err instanceof Error && err.message ? err.message : 'Failed to delete category.');
      }
    });
  }

  return (
    <div className="group relative rounded-2xl border border-[#e5dbd0] bg-[#fffdf9] p-3.5 sm:p-4 shadow-lg transition-all hover:border-amber-400/50 hover:bg-[#fffdf9]">
      <Link href={`/admin/menu/${categoryId}`} className="flex items-center gap-3">
        {isValidImageSrc(imageUrl) ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#e5dbd0]">
            <Image src={imageUrl} alt={name} fill sizes="48px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#e5dbd0] bg-[#f1eae1]">
            <PlateIcon className="h-5 w-5 text-[#796b60]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#352c29] group-hover:text-[#85233e] transition-colors text-sm sm:text-base">{name}</p>
          <p className="text-xs text-[#796b60] font-medium mt-0.5">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="absolute top-3 right-3 hidden text-xs font-semibold text-rose-700 group-hover:block disabled:opacity-60 hover:text-rose-700 transition-colors cursor-pointer"
      >
        Delete
      </button>
    </div>
  );
}
