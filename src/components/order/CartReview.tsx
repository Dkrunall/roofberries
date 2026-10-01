'use client';

import { useState, useTransition } from 'react';
import { unstable_rethrow } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { formatPrice } from '@/lib/format';
import { placeOrder } from '@/lib/actions/orders';
import { primeAudio, requestNotificationPermission } from '@/lib/alerts';
import { CartIcon, PencilIcon, PlateIcon, UsersIcon, WarningIcon } from '@/components/icons';

function GuestNameEditor({ guestName, onRename }: { guestName: string; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(guestName);

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onRename(draft);
          setEditing(false);
        }}
        className="flex items-center gap-1.5"
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onRename(draft);
            setEditing(false);
          }}
          maxLength={40}
          className="w-28 rounded-lg border border-amber-500/40 bg-black/60 px-2 py-1 text-xs font-bold text-amber-100 outline-none focus:border-amber-400"
        />
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(guestName);
        setEditing(true);
      }}
      className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
    >
      {guestName}
      <PencilIcon className="h-3 w-3 opacity-70" />
    </button>
  );
}

export function CartReview({ tableNumber }: { tableNumber: number }) {
  const { lines, updateQuantity, removeLine, totalPrice, guestId, guestName, setGuestName } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const guestCount = new Set(lines.map((l) => l.guestId)).size;

  function handlePlaceOrder() {
    setError(null);
    primeAudio();
    void requestNotificationPermission();
    startTransition(async () => {
      try {
        await placeOrder(tableNumber);
      } catch (err) {
        unstable_rethrow(err);
        setError(err instanceof Error && err.message ? err.message : 'Something went wrong placing your order. Please try again.');
      }
    });
  }

  if (lines.length === 0) {
    return (
      <div className="glass-panel mx-auto my-8 flex max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center border border-amber-500/30 gold-glow-sm">
        <CartIcon className="h-10 w-10 text-amber-400 animate-bounce" />
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-amber-50">Your Cart is Empty</h2>
          <p className="text-xs sm:text-sm text-amber-200/80 max-w-xs mx-auto leading-relaxed">
            Browse our Roofberries digital menu and add your favorite dishes to place a table order.
          </p>
        </div>
        <Link
          href={`/order?table=${tableNumber}`}
          className="mt-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-3 text-xs sm:text-sm font-black text-black shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          Browse Digital Menu →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Table confirmation header banner */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#121215] p-3.5 sm:p-4 shadow-xl">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <PlateIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs sm:text-sm font-bold text-zinc-100 uppercase tracking-wide">Roofberries Table Order</p>
            <p className="truncate text-[11px] sm:text-xs text-zinc-400">Serving directly to Table {tableNumber}</p>
          </div>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300">
          Table {tableNumber}
        </span>
      </div>

      {/* Shared table guest indicator & name editor */}
      <div className="flex items-center justify-between rounded-2xl border border-amber-900/30 bg-black/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-amber-200/80">
          <UsersIcon className="h-4 w-4 text-amber-400" />
          <span>Ordering as:</span>
          <GuestNameEditor guestName={guestName} onRename={setGuestName} />
        </div>
        {guestCount > 1 ? (
          <span className="text-xs font-bold text-amber-400">
            {guestCount} guests ordering together
          </span>
        ) : null}
      </div>

      {/* Cart item cards list */}
      <div className="space-y-3">
        {lines.map((line) => (
          <div
            key={line.id}
            className="glass-card flex flex-col gap-3 rounded-3xl p-4 sm:p-5 border border-amber-500/20 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {line.imageUrl ? (
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border border-amber-500/30">
                    <img src={line.imageUrl} alt={line.menuItemName} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base sm:text-lg font-black text-amber-50">{line.menuItemName}</p>
                  {line.variantLabel ? (
                    <p className="text-xs font-bold text-amber-400">{line.variantLabel}</p>
                  ) : null}
                  <p className="text-xs sm:text-sm font-black text-amber-300/90 pt-0.5">
                    {formatPrice(line.unitPrice)} each
                  </p>
                </div>
              </div>

              <span className="text-base sm:text-lg font-black text-amber-300">
                {formatPrice(line.unitPrice * line.quantity)}
              </span>
            </div>

            {line.notes ? (
              <p className="rounded-xl border border-amber-900/30 bg-black/40 px-3 py-1.5 text-xs italic text-amber-200/80">
                &ldquo;{line.notes}&rdquo;
              </p>
            ) : null}

            <div className="flex items-center justify-between border-t border-amber-900/30 pt-3">
              <span className="text-xs font-semibold text-amber-200/70">
                Added by <strong className="text-amber-100">{line.guestName}</strong>
              </span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-black/60 p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.id, line.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-300 hover:bg-amber-500/20 active:scale-90 text-base font-black transition-all"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-xs sm:text-sm font-black text-amber-50">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.id, line.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-300 hover:bg-amber-500/20 active:scale-90 text-base font-black transition-all"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="rounded-lg p-1.5 text-amber-400/60 hover:text-rose-400 active:scale-90 transition-colors"
                  aria-label="Remove item"
                >
                  <span className="text-sm font-black">✕</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill summary breakdown */}
      <div className="glass-panel space-y-3 rounded-3xl p-5 border border-amber-500/30 shadow-2xl">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400">Order Summary</h3>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-amber-200/80">
            <span>Subtotal ({lines.reduce((n, l) => n + l.quantity, 0)} items)</span>
            <span className="font-bold text-amber-100">{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-amber-200/80">
            <span>Taxes &amp; Service Charges</span>
            <span className="font-semibold text-amber-200/60">As applicable</span>
          </div>
          <div className="border-t border-amber-900/30 pt-3 flex justify-between text-base sm:text-lg font-black text-amber-50">
            <span>Total Payable</span>
            <span className="text-amber-300">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {error ? (
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-400 pt-2">
            <WarningIcon className="h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={isPending}
          onClick={handlePlaceOrder}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-4 px-5 text-sm font-black text-black shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
        >
          {isPending ? (
            <span>Sending to Kitchen…</span>
          ) : (
            <>
              <span>Place Kitchen Order</span>
              <span>·</span>
              <span>{formatPrice(totalPrice)}</span>
              <span className="text-base font-black">→</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center pt-2">
        <Link
          href={`/order?table=${tableNumber}`}
          className="text-xs font-bold text-amber-400/80 hover:text-amber-300 transition-colors"
        >
          + Add more items from menu
        </Link>
      </div>
    </div>
  );
}
