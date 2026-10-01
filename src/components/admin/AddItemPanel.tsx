'use client';

import { useState } from 'react';
import { MenuItemForm } from './MenuItemForm';

export function AddItemPanel({ categoryId, nextSortOrder }: { categoryId: string; nextSortOrder: number }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-card-border py-3 text-sm font-semibold text-accent"
      >
        + Add item to this category
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card p-3">
      <MenuItemForm
        categoryId={categoryId}
        initial={{ sortOrder: nextSortOrder, isAvailable: true }}
        onDone={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
