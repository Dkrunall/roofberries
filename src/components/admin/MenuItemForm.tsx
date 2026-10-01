'use client';

import { useState, useTransition } from 'react';
import { createMenuItem, updateMenuItem, type MenuItemInput, type MenuItemVariantInput } from '@/lib/actions/menu';
import type { DietaryType } from '@/types/database';
import { CloseIcon } from '@/components/icons';

const DIETARY_OPTIONS: { value: DietaryType | ''; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-Veg' },
  { value: 'egg', label: 'Contains Egg' },
  { value: 'seafood', label: 'Seafood' },
];

export function MenuItemForm({
  categoryId,
  itemId,
  initial,
  onDone,
  onCancel,
}: {
  categoryId: string;
  itemId?: string;
  initial?: Partial<MenuItemInput>;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [dietaryType, setDietaryType] = useState<DietaryType | ''>(initial?.dietaryType ?? '');
  const [isAlcoholic, setIsAlcoholic] = useState(initial?.isAlcoholic ?? false);
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [variants, setVariants] = useState<MenuItemVariantInput[]>(initial?.variants ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addVariant() {
    setVariants((v) => [...v, { label: '', price: 0 }]);
  }
  function updateVariant(i: number, patch: Partial<MenuItemVariantInput>) {
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: MenuItemInput = {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      dietaryType: dietaryType || null,
      isAlcoholic,
      isAvailable,
      sortOrder,
      variants,
    };
    startTransition(async () => {
      try {
        if (itemId) await updateMenuItem(itemId, input);
        else await createMenuItem(input);
        onDone?.();
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Failed to save item.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Image URL</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Price</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Dietary</label>
          <select
            value={dietaryType}
            onChange={(e) => setDietaryType(e.target.value as DietaryType | '')}
            className="w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          >
            {DIETARY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Sort order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col justify-end gap-1 pb-1.5">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isAlcoholic} onChange={(e) => setIsAlcoholic(e.target.checked)} />
            Alcoholic
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
            Available
          </label>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-xs font-medium text-muted">
            Serving-size variants (optional — e.g. Peg / Bottle)
          </label>
          <button type="button" onClick={addVariant} className="text-xs font-semibold text-accent">
            + Add variant
          </button>
        </div>
        {variants.length > 0 ? (
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder="Label, e.g. Peg"
                  value={v.label}
                  onChange={(e) => updateVariant(i, { label: e.target.value })}
                  className="flex-1 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                  className="w-28 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
                />
                <button type="button" onClick={() => removeVariant(i)} className="text-muted">
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
        >
          {isPending ? 'Saving…' : itemId ? 'Save item' : 'Add item'}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="rounded-full border border-card-border px-4 py-1.5 text-sm font-semibold">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
