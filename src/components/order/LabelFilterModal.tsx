'use client';

import { useState } from 'react';
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
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          checked ? 'border-amber-400 bg-amber-400' : 'border-amber-700/50'
        }`}
      >
        {checked ? <CheckIcon className="h-3 w-3 text-black" /> : null}
      </span>
      <span className="text-sm font-semibold text-amber-100">{label}</span>
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] sm:max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-t-[28px] sm:rounded-2xl border border-white/10 bg-[#121215] shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-bold text-zinc-100">Filter Menu</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white cursor-pointer"
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

          <div className="my-2.5 h-px bg-white/10" />
          <p className="pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Allergen Filters</p>

          <CheckboxRow label="Contains Allergens" checked={allAllergensExcluded} onChange={toggleAllAllergens} />
          {KNOWN_ALLERGENS.map((allergen) => (
            <CheckboxRow
              key={allergen}
              label={allergen}
              checked={draft.excludedAllergens.includes(allergen)}
              onChange={() => toggleAllergen(allergen)}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_LABEL_FILTERS)}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/5 transition-all cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="gold-gradient-btn flex-1 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
