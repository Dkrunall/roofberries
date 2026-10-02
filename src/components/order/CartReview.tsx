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
          aria-label="Your name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onRename(draft);
            setEditing(false);
          }}
          maxLength={40}
          className="w-28 rounded-lg border border-[#e5d9cc] bg-[#f5efe6] px-2 py-1 text-xs font-bold text-[#30251f] outline-none focus:border-[#e5d9cc]"
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
      className="flex items-center gap-1 text-xs font-bold text-[#85233e] hover:text-[#78675c] transition-colors"
    >
      {guestName}
      <PencilIcon className="h-3 w-3 opacity-70" />
    </button>
  );
}

export function CartReview({ tableNumber }: { tableNumber: number }) {
  const { lines, updateQuantity, removeLine, totalPrice, guestName, setGuestName } = useCart();
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
      <div className="bg-white mx-auto my-8 flex max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center border border-[#e5d9cc] ">
        <CartIcon className="h-10 w-10 text-[#85233e] " />
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-[#30251f]">Your cart is empty</h2>
          <p className="text-xs sm:text-sm text-[#78675c] max-w-xs mx-auto leading-relaxed">
            Add something delicious from the menu.
          </p>
        </div>
        <Link
          href={`/order?table=${tableNumber}`}
          className="mt-2 rounded-2xl bg-[#85233e] hover:bg-[#6c1c32] px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
        >
          Browse menu →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Table confirmation header banner */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5d9cc] bg-white p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4e6e9] text-[#85233e] border border-[#e5d9cc]">
            <PlateIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs sm:text-sm font-bold text-[#30251f] uppercase tracking-wide">Ready to order?</p>
            <p className="truncate text-[11px] sm:text-xs text-[#78675c]">Review your items before sending to the kitchen.</p>
          </div>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-xl border border-[#e5d9cc] bg-[#f4e6e9] px-3 py-1.5 text-xs font-bold text-[#85233e]">
          Table {tableNumber}
        </span>
      </div>

      {/* Shared table guest indicator & name editor */}
      <div className="flex items-center justify-between rounded-2xl border border-[#e5d9cc] bg-[#f5efe6] px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-[#78675c]">
          <UsersIcon className="h-4 w-4 text-[#85233e]" />
          <span>Ordering as:</span>
          <GuestNameEditor guestName={guestName} onRename={setGuestName} />
        </div>
        {guestCount > 1 ? (
          <span className="text-xs font-bold text-[#85233e]">
            {guestCount} guests ordering together
          </span>
        ) : null}
      </div>

      {/* Cart item cards list */}
      <div className="space-y-3">
        {lines.map((line) => (
          <div
            key={line.id}
            className="bg-white flex flex-col gap-3 rounded-3xl p-4 sm:p-5 border border-[#e5d9cc] shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {line.imageUrl ? (
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border border-[#e5d9cc]">
                    <img src={line.imageUrl} alt={line.menuItemName} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-semibold text-[#30251f]">{line.menuItemName}</p>
                  {line.variantLabel ? (
                    <p className="text-xs font-bold text-[#85233e]">{line.variantLabel}</p>
                  ) : null}
                  <p className="text-xs sm:text-sm font-semibold text-[#85233e] pt-0.5">
                    {formatPrice(line.unitPrice)} each
                  </p>
                </div>
              </div>

              <span className="text-base sm:text-lg font-semibold text-[#85233e]">
                {formatPrice(line.unitPrice * line.quantity)}
              </span>
            </div>

            {line.notes ? (
              <p className="rounded-xl border border-[#e5d9cc] bg-[#f5efe6] px-3 py-1.5 text-xs italic text-[#78675c]">
                &ldquo;{line.notes}&rdquo;
              </p>
            ) : null}

            <div className="flex items-center justify-between border-t border-[#e5d9cc] pt-3">
              <span className="text-xs font-semibold text-[#78675c]">
                Added by <strong className="text-[#30251f]">{line.guestName}</strong>
              </span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-[#e5d9cc] bg-[#f5efe6] p-1 ">
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.id, line.quantity - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#85233e] hover:bg-[#f4e6e9] active:scale-90 text-base font-semibold transition-all"
                    aria-label={`Decrease ${line.menuItemName} quantity`} disabled={isPending}
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-xs sm:text-sm font-semibold text-[#30251f]">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.id, line.quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#85233e] hover:bg-[#f4e6e9] active:scale-90 text-base font-semibold transition-all"
                    aria-label={`Increase ${line.menuItemName} quantity`} disabled={isPending}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="rounded-lg p-3 text-[#85233e] hover:text-rose-700 active:scale-90 transition-colors"
                  aria-label={`Remove ${line.menuItemName}`} disabled={isPending}
                >
                  <span className="text-sm font-semibold">✕</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill summary breakdown */}
      <div className="bg-white space-y-3 rounded-3xl p-5 border border-[#e5d9cc] shadow-sm">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#85233e]">Order Summary</h3>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-[#78675c]">
            <span>Subtotal ({lines.reduce((n, l) => n + l.quantity, 0)} items)</span>
            <span className="font-bold text-[#30251f]">{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-[#78675c]">
            <span>Taxes &amp; Service Charges</span>
            <span className="font-semibold text-[#78675c]">As applicable</span>
          </div>
          <div className="border-t border-[#e5d9cc] pt-3 flex justify-between text-base sm:text-lg font-semibold text-[#30251f]">
            <span>Items total</span>
            <span className="text-[#85233e]">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {error ? (
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-700 pt-2">
            <WarningIcon className="h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={isPending}
          onClick={handlePlaceOrder}
          className="mt-3 w-full rounded-2xl bg-[#85233e] hover:bg-[#6c1c32] py-4 px-5 text-sm font-semibold text-white shadow-sm  hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
        >
          {isPending ? (
            <span>Sending to Kitchen…</span>
          ) : (
            <>
              <span>Place order</span>
              <span>·</span>
              <span>{formatPrice(totalPrice)}</span>
              <span className="text-base font-semibold">→</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center pt-2">
        <Link
          href={`/order?table=${tableNumber}`}
          className="text-xs font-bold text-[#85233e] hover:text-[#85233e] transition-colors"
        >
          + Add more items from menu
        </Link>
      </div>
    </div>
  );
}
