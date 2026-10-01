'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MenuItem } from '@/types/menu';
import { useCart } from '@/lib/cart/CartContext';
import { formatPrice } from '@/lib/format';
import { AlcoholicBadge, DietaryBadge } from './DietaryBadge';
import { isValidImageSrc } from '@/lib/imageUrl';
import { CheckIcon, WarningIcon } from '@/components/icons';

export function MenuItemRow({ item, categoryName }: { item: MenuItem; categoryName: string }) {
  const { addLine } = useCart();
  const [expanded, setExpanded] = useState(false);
  // Items with variants (e.g. Peg / Bottle) get their own quantity per
  // option, keyed by variant id, so a customer can order 2 Pegs and a
  // Bottle in one tap instead of repeating the whole add flow per variant.
  // Items with no variants just use a single quantity, starting at 1.
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [justAdded, setJustAdded] = useState(false);
  // Drives both the button's disabled state (guards a double-tap firing
  // handleAdd twice — the button is otherwise still on-screen for one more
  // render before the panel collapses) and whether the "Added" confirmation
  // is honest: it only fires once addLine has actually resolved, not just
  // been called, so a failed/timed-out add no longer claims success.
  const [isAdding, setIsAdding] = useState(false);
  const [addFailed, setAddFailed] = useState(false);

  const hasVariants = item.variants.length > 0;
  const priceLabel = hasVariants
    ? `From ${formatPrice(Math.min(...item.variants.map((v) => v.price)))}`
    : item.isAvailable
      ? formatPrice(item.price)
      : 'Sold out';

  function variantQty(variantId: string) {
    return variantQuantities[variantId] ?? 0;
  }

  function setVariantQty(variantId: string, qty: number) {
    setVariantQuantities((prev) => ({ ...prev, [variantId]: Math.max(0, qty) }));
  }

  const totalVariantQuantity = Object.values(variantQuantities).reduce((n, q) => n + q, 0);
  const totalVariantPrice = item.variants.reduce((sum, v) => sum + variantQty(v.id) * v.price, 0);

  function resetAndCollapse() {
    setJustAdded(true);
    setVariantQuantities({});
    setQuantity(1);
    setNotes('');
    setExpanded(false);
    setTimeout(() => setJustAdded(false), 1600);
  }

  async function handleAdd() {
    if (isAdding) return;
    setIsAdding(true);
    setAddFailed(false);

    let ok = true;
    if (hasVariants) {
      if (totalVariantQuantity === 0) {
        setIsAdding(false);
        return;
      }
      for (const v of item.variants) {
        const qty = variantQty(v.id);
        if (qty === 0) continue;
        const added = await addLine({
          menuItemId: item.id,
          menuItemName: item.name,
          categoryName,
          variantId: v.id,
          variantLabel: v.label,
          unitPrice: v.price,
          quantity: qty,
          notes,
          imageUrl: item.imageUrl,
        });
        ok = ok && added;
      }
    } else {
      ok = await addLine({
        menuItemId: item.id,
        menuItemName: item.name,
        categoryName,
        variantId: null,
        variantLabel: null,
        unitPrice: item.price,
        quantity,
        notes,
        imageUrl: item.imageUrl,
      });
    }

    setIsAdding(false);
    if (ok) {
      resetAndCollapse();
    } else {
      // The cart never finished loading (see CartContext.addLine) — don't
      // claim success, keep the panel open with the customer's selections
      // intact so they can just try again once their connection catches up.
      setAddFailed(true);
      setTimeout(() => setAddFailed(false), 3000);
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${expanded
          ? 'border-amber-400/60 bg-[#16161a] shadow-2xl ring-1 ring-amber-400/20'
          : 'border-white/5 bg-[#121215] hover:border-white/15 hover:bg-[#16161a]'
        } ${!item.isAvailable ? 'opacity-40' : ''}`}
    >
      <button
        type="button"
        disabled={!item.isAvailable}
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 text-left disabled:cursor-not-allowed cursor-pointer"
      >
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
          {isValidImageSrc(item.imageUrl) ? (
            <div className="relative h-16 w-16 sm:h-18 sm:w-18 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(min-width: 640px) 72px, 64px"
                className="object-cover transition-transform duration-500 hover:scale-105"
                unoptimized
              />
            </div>
          ) : null}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {item.dietaryType ? <DietaryBadge type={item.dietaryType} /> : null}
              {item.isAlcoholic ? <AlcoholicBadge /> : null}
            </div>
            <p className="font-bold text-zinc-100 text-base sm:text-lg leading-snug tracking-tight">{item.name}</p>
            {item.description ? (
              <p className="line-clamp-2 text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">{item.description}</p>
            ) : null}
            <p className="text-sm sm:text-base font-extrabold text-amber-400 pt-0.5 tracking-tight">{priceLabel}</p>
          </div>
        </div>

        {item.isAvailable ? (
          <span
            className={`flex shrink-0 items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 ${justAdded
                ? 'bg-emerald-500 text-black shadow-emerald-500/30 scale-105'
                : expanded
                  ? 'border border-zinc-700 bg-zinc-800 text-zinc-300'
                  : 'gold-gradient-btn'
              }`}
          >
            {expanded ? 'Close' : justAdded ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Added
              </>
            ) : (
              '+ Add'
            )}
          </span>
        ) : null}
      </button>

      {expanded && item.isAvailable ? (
        <div className="space-y-4 border-t border-white/5 bg-black/30 p-4 sm:p-5 animate-fadeIn">
          {hasVariants ? (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-zinc-400 tracking-wider uppercase">Choose Quantity:</p>
              <div className="space-y-2">
                {item.variants.map((v) => {
                  const qty = variantQty(v.id);
                  return (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-all ${qty > 0 ? 'border-amber-400/50 bg-amber-500/10' : 'border-white/5 bg-zinc-900/40'
                        }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-200">{v.label}</p>
                        <p className="text-xs sm:text-sm font-extrabold text-amber-400">{formatPrice(v.price)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-black/60 p-1">
                        <button
                          type="button"
                          onClick={() => setVariantQty(v.id, qty - 1)}
                          disabled={qty === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-amber-400 hover:bg-white/10 active:scale-90 text-lg font-bold transition-all disabled:opacity-25 disabled:hover:bg-transparent"
                          aria-label={`Decrease ${v.label} quantity`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-zinc-100">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setVariantQty(v.id, qty + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-amber-400 hover:bg-white/10 active:scale-90 text-lg font-bold transition-all"
                          aria-label={`Increase ${v.label} quantity`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='E.g. "Less spicy", "No onion", "Extra ice"...'
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>

          {addFailed ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
              <WarningIcon className="h-4 w-4 shrink-0" />
              Couldn&rsquo;t add — check your connection and try again.
            </p>
          ) : null}

          {hasVariants ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={totalVariantQuantity === 0 || isAdding}
              className="gold-gradient-btn w-full rounded-xl py-3.5 px-4 text-sm font-bold flex items-center justify-between shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{isAdding ? 'Adding to order…' : 'Add to Order'}</span>
              <span className="rounded-lg bg-black/20 px-2.5 py-0.5 text-xs font-black">
                {totalVariantQuantity > 0 ? formatPrice(totalVariantPrice) : `${item.variants.length} options`}
              </span>
            </button>
          ) : (
            <div className="space-y-3 pt-1">
              {/* Stepper selector row */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3 py-2">
                <span className="text-xs font-semibold text-zinc-300">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-amber-400 hover:bg-zinc-800 active:scale-90 text-base font-bold transition-all cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-zinc-100">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-amber-400 hover:bg-zinc-800 active:scale-90 text-base font-bold transition-all cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Full-width Add to Order button with price pill */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding}
                className="gold-gradient-btn w-full rounded-xl py-3.5 px-4 text-sm font-bold flex items-center justify-between shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isAdding ? 'Adding…' : 'Add to Order'}</span>
                <span className="rounded-lg bg-black/20 px-2.5 py-0.5 text-xs font-black">
                  {formatPrice(item.price * quantity)}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
