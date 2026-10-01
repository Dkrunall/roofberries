'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import type { OrderHistoryEntry } from '@/lib/data/orderHistory';

const STATUS_STYLE: Record<string, string> = {
  placed: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  preparing: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  served: 'border-amber-900/30 bg-black/40 text-amber-200/50',
};

export function OrderHistoryRow({ order, sittingLabel }: { order: OrderHistoryEntry; sittingLabel?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-900/30 bg-[#161310] shadow-lg transition-all hover:border-amber-500/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-extrabold text-amber-50 text-base">Table {order.tableNumber}</span>
          {sittingLabel ? (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-300">
              {sittingLabel}
            </span>
          ) : null}
          <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLE[order.status] ?? ''}`}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
          <span className="text-xs text-amber-200/50 font-medium">
            {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm font-extrabold text-amber-400">{formatPrice(order.total)}</span>
          <span className="text-xs text-amber-300 font-bold">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open ? (
        <div className="space-y-2 border-t border-amber-900/20 bg-black/30 p-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-xs text-amber-100/90">
              <div>
                <span className="font-extrabold text-amber-400">{item.quantity}×</span>{' '}
                <span className="font-semibold">{item.menuItemName}</span>
                {item.variantLabel ? <span className="text-amber-300 font-medium"> ({item.variantLabel})</span> : null}
                {item.notes ? <p className="text-[11px] text-amber-200/50 italic">&ldquo;{item.notes}&rdquo;</p> : null}
              </div>
              <span className="font-bold text-amber-300/80">{formatPrice(item.priceAtOrder * item.quantity)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

