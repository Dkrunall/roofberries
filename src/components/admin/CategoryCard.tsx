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
    <div className="group relative rounded-2xl border border-white/10 bg-[#121215] p-3.5 sm:p-4 shadow-lg transition-all hover:border-amber-400/50 hover:bg-[#16161a]">
      <Link href={`/admin/menu/${categoryId}`} className="flex items-center gap-3">
        {isValidImageSrc(imageUrl) ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
            <Image src={imageUrl} alt={name} fill sizes="48px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-zinc-900">
            <PlateIcon className="h-5 w-5 text-zinc-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-zinc-100 group-hover:text-amber-300 transition-colors text-sm sm:text-base">{name}</p>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="absolute top-3 right-3 hidden text-xs font-semibold text-rose-400 group-hover:block disabled:opacity-60 hover:text-rose-300 transition-colors cursor-pointer"
      >
        Delete
      </button>
    </div>
  );
}
