'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryForm } from './CategoryForm';
import type { CategoryInput } from '@/lib/actions/menu';

export function EditCategoryPanel({ categoryId, initial }: { categoryId: string; initial: CategoryInput }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5dbd0] bg-[#fffdf9] p-4 sm:p-5 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#352c29]">{initial.name}</h1>
          <p className="text-xs sm:text-sm text-[#85233e] font-semibold mt-0.5">{initial.section}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-xl border border-[#e5dbd0] bg-[#f1eae1] px-4 py-2 text-xs font-bold text-[#352c29] hover:border-amber-400/40 hover:text-[#85233e] active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          Edit Category
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e5dbd0] bg-[#fffdf9] p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#e5dbd0] pb-3 mb-3">
        <h2 className="text-xs font-bold tracking-wider text-[#796b60] uppercase">Edit Category Details</h2>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-semibold text-[#796b60] hover:text-[#85233e] cursor-pointer"
        >
          Cancel
        </button>
      </div>
      <CategoryForm
        categoryId={categoryId}
        initial={initial}
        onDone={() => {
          setEditing(false);
          router.refresh();
        }}
      />
    </div>
  );
}
