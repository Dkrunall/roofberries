'use client';

import { useState, useTransition } from 'react';
import type { MenuItem } from '@/types/menu';
import { deleteMenuItem, setMenuItemAvailability } from '@/lib/actions/menu';
import { formatPrice } from '@/lib/format';
import { MenuItemForm } from './MenuItemForm';

export function MenuItemAdminRow({ item, categoryId }: { item: MenuItem; categoryId: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggleAvailability() {
    startTransition(async () => {
      try {
        await setMenuItemAvailability(item.id, !item.isAvailable);
      } catch (err) {
        window.alert(err instanceof Error && err.message ? err.message : 'Failed to update availability.');
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteMenuItem(item.id);
      } catch (err) {
        window.alert(err instanceof Error && err.message ? err.message : 'Failed to delete item.');
      }
    });
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#16161a] p-4 sm:p-5 shadow-2xl">
        <MenuItemForm
          categoryId={categoryId}
          itemId={item.id}
          initial={{
            name: item.name,
            description: item.description ?? '',
            price: item.price,
            imageUrl: item.imageUrl ?? '',
            dietaryType: item.dietaryType,
            isAlcoholic: item.isAlcoholic,
            isAvailable: item.isAvailable,
            sortOrder: item.sortOrder,
            variants: item.variants.map((v) => ({ label: v.label, price: v.price })),
          }}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#121215] p-3.5 sm:p-4 shadow-lg transition-all hover:border-white/20 hover:bg-[#16161a]">
      <div className="min-w-0 basis-full sm:flex-1 space-y-0.5">
        <p className="truncate font-bold text-zinc-100 text-sm sm:text-base">{item.name}</p>
        <p className="text-xs font-semibold text-amber-400">
          {item.variants.length > 0
            ? `From ${formatPrice(Math.min(...item.variants.map((v) => v.price)))} · ${item.variants.length} variant(s)`
            : formatPrice(item.price)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={handleToggleAvailability}
          disabled={isPending}
          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            item.isAvailable
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          }`}
        >
          {item.isAvailable ? 'Available' : 'Sold Out'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

