'use client';

import { useEffect, useRef, useState } from 'react';
import { KNOWN_ALLERGENS } from '@/lib/allergens';
import { CheckIcon, CloseIcon } from '@/components/icons';

export interface LabelFilters {
  nonVegOnly: boolean;
  nonAlcoholicOnly: boolean;
  /** Items containing any of these allergens are hidden. */
  excludedAllergens: string[];
}

export const DEFAULT_LABEL_FILTERS: LabelFilters = {
  nonVegOnly: false,
  nonAlcoholicOnly: false,
  excludedAllergens: [],
};

export function isLabelFilterActive(f: LabelFilters): boolean {
  return f.nonVegOnly || f.nonAlcoholicOnly || f.excludedAllergens.length > 0;
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3 py-2.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#85233e] peer-focus-visible:ring-offset-2 ${
          checked ? 'border-[#85233e] bg-[#85233e]' : 'border-[#bbab9b]'
        }`}
      >
        {checked ? <CheckIcon className="h-3 w-3 text-white" /> : null}
      </span>
      <span className="text-sm font-semibold text-[#352c29]">{label}</span>
    </label>
  );
}

export function LabelFilterModal({
  value,
  onApply,
  onClose,
}: {
  value: LabelFilters;
  onApply: (next: LabelFilters) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  const [draft, setDraft] = useState<LabelFilters>(value);

  function toggleAllergen(allergen: string) {
    setDraft((d) => ({
      ...d,
      excludedAllergens: d.excludedAllergens.includes(allergen)
        ? d.excludedAllergens.filter((a) => a !== allergen)
        : [...d.excludedAllergens, allergen],
    }));
  }

  const allAllergensExcluded = draft.excludedAllergens.length === KNOWN_ALLERGENS.length;

  function toggleAllAllergens() {
    setDraft((d) => ({ ...d, excludedAllergens: allAllergensExcluded ? [] : [...KNOWN_ALLERGENS] }));
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="filter-title"
      onCancel={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-black/45 open:flex items-end sm:items-center justify-center sm:p-4"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className="flex max-h-[85vh] sm:max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[28px] sm:rounded-2xl border border-[#e3d9ce] bg-[#faf7f0] shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e3d9ce] px-5 py-4">
          <h2 id="filter-title" className="text-base font-bold text-[#352c29]">Filter Menu</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#77685c] hover:bg-[#eee5db] hover:text-[#85233e] cursor-pointer"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          <CheckboxRow
            label="Non Veg Only"
            checked={draft.nonVegOnly}
            onChange={() => setDraft((d) => ({ ...d, nonVegOnly: !d.nonVegOnly }))}
          />
          <CheckboxRow
            label="Non Alcoholic Drinks"
            checked={draft.nonAlcoholicOnly}
            onChange={() => setDraft((d) => ({ ...d, nonAlcoholicOnly: !d.nonAlcoholicOnly }))}
          />

          <div className="my-2.5 h-px bg-[#eee5db]" />
          <p className="pb-1 text-xs font-semibold uppercase tracking-wider text-[#77685c]">Hide items containing</p>

          <CheckboxRow label="Exclude all listed allergens" checked={allAllergensExcluded} onChange={toggleAllAllergens} />
          {KNOWN_ALLERGENS.map((allergen) => (
            <CheckboxRow
              key={allergen}
              label={allergen}
              checked={draft.excludedAllergens.includes(allergen)}
              onChange={() => toggleAllergen(allergen)}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-[#e3d9ce] px-5 py-4">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_LABEL_FILTERS)}
            className="rounded-xl border border-[#e3d9ce] px-4 py-2.5 text-xs font-semibold text-[#5c4d43] hover:bg-white/5 transition-all cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="bg-[#85233e] text-white hover:bg-[#6c1c32] flex-1 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </dialog>
  );
}
