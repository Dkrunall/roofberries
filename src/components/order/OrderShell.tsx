'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CartProvider, useCart } from '@/lib/cart/CartContext';
import { formatPrice } from '@/lib/format';

function CartBar({ tableNumber }: { tableNumber: number }) {
  const { totalItems, totalPrice } = useCart();
  if (totalItems === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none flex justify-center">
      <Link
        href={`/order/cart?table=${tableNumber}`}
        className="gold-gradient-btn pointer-events-auto w-full max-w-lg flex items-center justify-between gap-3 sm:gap-4 rounded-2xl px-4 sm:px-5 py-3.5 shadow-2xl border border-yellow-300/40"
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-amber-300 text-xs font-extrabold">
            {totalItems}
          </span>
          <div className="flex min-w-0 flex-col text-left">
            <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-black/75">
              Review Cart
            </span>
            <span className="whitespace-nowrap text-sm sm:text-base font-extrabold text-black tracking-tight">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-black px-3.5 py-2 text-xs font-bold text-amber-300 shadow-md">
          <span className="whitespace-nowrap">View Order</span>
          <span className="text-sm font-bold">→</span>
        </div>
      </Link>
    </div>
  );
}

export function OrderHeader({
  tableNumber,
  title,
  backHref,
  onBack,
  dietFilter = 'all',
  onDietFilterChange,
  onOpenFilters,
  filterActive = false,
  isSearchOpen,
  onToggleSearch,
}: {
  tableNumber?: number;
  title?: string;
  backHref?: string;
  onBack?: () => void;
  dietFilter?: 'all' | 'veg' | 'non_veg';
  onDietFilterChange?: (filter: 'all' | 'veg' | 'non_veg') => void;
  onOpenFilters?: () => void;
  filterActive?: boolean;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
}) {
  if (title) {
    return (
      <header className="sticky top-2 z-40 mx-3 my-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121215]/90 px-3.5 sm:px-4 py-2.5 backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-200 hover:border-white/20 active:scale-95 transition-all cursor-pointer"
              aria-label="Back"
            >
              <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : backHref ? (
            <Link
              href={backHref}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-200 hover:border-white/20 active:scale-95 transition-all"
              aria-label="Back"
            >
              <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ) : null}
          <h1 className="min-w-0 flex-1 truncate text-base font-bold text-zinc-100">{title}</h1>
        </div>

        {/* Veg filter inside header */}
        <div className="flex items-center gap-2 shrink-0">
          {onDietFilterChange ? (
            <button
              type="button"
              onClick={() => onDietFilterChange(dietFilter === 'veg' ? 'all' : 'veg')}
              className="flex items-center gap-1.5 cursor-pointer select-none py-1 px-2 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-white/20 active:scale-95 transition-all"
              title={dietFilter === 'veg' ? 'Showing Veg Only' : 'Show Veg Only'}
            >
              <div
                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${dietFilter === 'veg' ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition-transform duration-300 ${dietFilter === 'veg' ? 'translate-x-3' : 'translate-x-0'
                    }`}
                />
              </div>
              <span className={`text-[11px] font-bold ${dietFilter === 'veg' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                Veg
              </span>
            </button>
          ) : null}

          {onOpenFilters ? (
            <button
              type="button"
              onClick={onOpenFilters}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${filterActive
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                  : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                }`}
              title="Filter Menu"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
              </svg>
            </button>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-2 z-40 mx-3 my-2 flex items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-[#121215]/90 px-3.5 sm:px-4 py-2.5 backdrop-blur-2xl shadow-xl">
      {/* Left: Veg Switch */}
      <div className="flex items-center gap-2">
        {onDietFilterChange ? (
          <button
            type="button"
            onClick={() => {
              if (dietFilter === 'veg') {
                onDietFilterChange('all');
              } else {
                onDietFilterChange('veg');
              }
            }}
            className="flex items-center gap-1.5 cursor-pointer select-none py-1 px-2 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-white/20 active:scale-95 transition-all"
            title={dietFilter === 'veg' ? 'Showing Veg Only' : 'Show Veg Only'}
          >
            <div
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${dietFilter === 'veg' ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition-transform duration-300 ${dietFilter === 'veg' ? 'translate-x-3' : 'translate-x-0'
                  }`}
              />
            </div>
            <span className={`text-[11px] font-bold ${dietFilter === 'veg' ? 'text-emerald-400' : 'text-zinc-400'}`}>
              Veg
            </span>
          </button>
        ) : null}
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenFilters ? (
          <button
            type="button"
            onClick={onOpenFilters}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${filterActive
                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
              }`}
            title="Filter Menu"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
            </svg>
          </button>
        ) : onDietFilterChange ? (
          <button
            type="button"
            onClick={() => {
              if (dietFilter === 'all') onDietFilterChange('veg');
              else if (dietFilter === 'veg') onDietFilterChange('non_veg');
              else onDietFilterChange('all');
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${dietFilter !== 'all'
                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
              }`}
            title="Filter Menu"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
            </svg>
          </button>
        ) : null}

        {onToggleSearch ? (
          <button
            type="button"
            onClick={onToggleSearch}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 cursor-pointer ${isSearchOpen
                ? 'border-amber-500 bg-amber-500 text-white font-bold'
                : 'border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
              }`}
            title="Search Menu"
          >
            <svg className="h-3.5 w-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>
          </button>
        ) : null}

        {tableNumber ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-amber-400 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            T-{tableNumber}
          </span>
        ) : null}
      </div>
    </header>
  );
}

/** Outer frame: cart context + page scroll area + floating cart bar. No header. */
export function OrderFrame({
  tableNumber,
  showCartBar = true,
  children,
}: {
  tableNumber: number;
  showCartBar?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CartProvider tableNumber={tableNumber}>
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col pb-28 bg-[#09090b]">
        {children}
        {showCartBar ? <CartBar tableNumber={tableNumber} /> : null}
      </div>
    </CartProvider>
  );
}

/** Convenience: frame + static header, for simple pages (cart, status). */
export function OrderShell({
  tableNumber,
  title,
  backHref,
  showCartBar = true,
  children,
}: {
  tableNumber: number;
  title: string;
  backHref?: string;
  showCartBar?: boolean;
  children: React.ReactNode;
}) {
  return (
    <OrderFrame tableNumber={tableNumber} showCartBar={showCartBar}>
      <OrderHeader tableNumber={tableNumber} title={title} backHref={backHref} />
      <main className="flex-1 px-4 pt-4">{children}</main>
    </OrderFrame>
  );
}


