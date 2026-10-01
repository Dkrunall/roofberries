'use client';

import type { DietFilter } from './dietFilter';

/**
 * The same veg toggle switch + filter funnel combo used in the home
 * topbar, reused wherever a diet filter is needed (subcategory screen,
 * search results) so the control looks and behaves identically everywhere
 * instead of a separate "All / Veg / Non-Veg" pill row.
 *
 * The funnel button either cycles All → Veg → Non-Veg (default), or —
 * when `onOpenFilters` is given — opens the full "Filter by Labels" modal
 * instead, with `filterActive` driving its highlighted state.
 */
export function VegDietFilter({
  value,
  onChange,
  onOpenFilters,
  filterActive = false,
}: {
  value: DietFilter;
  onChange: (v: DietFilter) => void;
  onOpenFilters?: () => void;
  filterActive?: boolean;
}) {
  const funnelActive = onOpenFilters ? filterActive : value !== 'all';

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(value === 'veg' ? 'all' : 'veg')}
        className="flex items-center gap-2 cursor-pointer select-none py-1 px-1.5 rounded-full hover:bg-amber-500/10 transition-colors"
        title={value === 'veg' ? 'Showing Veg Only' : 'Show Veg Only'}
      >
        <div
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${
            value === 'veg' ? 'bg-emerald-500' : 'bg-neutral-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
              value === 'veg' ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
        <span className={`text-xs font-bold ${value === 'veg' ? 'text-emerald-400 font-black' : 'text-amber-100/90'}`}>
          Veg
        </span>
      </button>

      <button
        type="button"
        onClick={() => (onOpenFilters ? onOpenFilters() : onChange(value === 'all' ? 'veg' : value === 'veg' ? 'non_veg' : 'all'))}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
          funnelActive
            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
            : 'border-amber-900/40 bg-black/40 text-amber-200/70 hover:border-amber-500/40'
        }`}
        title="Filter Menu"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
        </svg>
      </button>

      {!onOpenFilters && value === 'non_veg' ? <span className="text-xs font-bold text-amber-300">Non-Veg only</span> : null}
    </div>
  );
}
