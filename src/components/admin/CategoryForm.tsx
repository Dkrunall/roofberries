'use client';

import { useState, useTransition } from 'react';
import { createCategory, updateCategory, type CategoryInput } from '@/lib/actions/menu';

export function CategoryForm({
  initial,
  categoryId,
  onDone,
}: {
  initial?: CategoryInput;
  categoryId?: string;
  onDone?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [section, setSection] = useState(initial?.section ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: CategoryInput = { name, section, sortOrder, imageUrl };
    startTransition(async () => {
      try {
        if (categoryId) await updateCategory(categoryId, input);
        else await createCategory(input);
        if (!categoryId) {
          setName('');
          setSection('');
          setSortOrder(0);
          setImageUrl('');
        }
        onDone?.();
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Failed to save category.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Category name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Section</label>
        <input
          required
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder="e.g. Food, Bar, Barista"
          className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Sort order</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-20 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="min-w-[220px] flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">Image URL (shown on category cards)</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground disabled:opacity-60"
      >
        {isPending ? 'Saving…' : categoryId ? 'Save' : 'Add category'}
      </button>
      {error ? <p className="w-full text-sm text-red-700 dark:text-red-400">{error}</p> : null}
    </form>
  );
}
