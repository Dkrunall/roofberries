'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import type { OrderHistoryEntry } from '@/lib/data/orderHistory';

const STATUS_STYLE: Record<string, string> = {
  placed: 'border-rose-500/30 bg-rose-500/10 text-rose-700',
  preparing: 'border-amber-500/30 bg-amber-500/10 text-[#85233e]',
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  served: 'border-[#e5dbd0] bg-[#f5efe7] text-[#85233e]',
};

export function OrderHistoryRow({ order, sittingLabel }: { order: OrderHistoryEntry; sittingLabel?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5dbd0] bg-[#fffdf9] shadow-lg transition-all hover:border-amber-500/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-wrap items-center gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-extrabold text-[#85233e] text-base">Table {order.tableNumber}</span>
          {sittingLabel ? (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-700">
              {sittingLabel}
            </span>
          ) : null}
          <span className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLE[order.status] ?? ''}`}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
          <span className="text-xs text-[#85233e] font-medium">
            {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm font-extrabold text-[#85233e]">{formatPrice(order.total)}</span>
          <span className="text-xs text-[#85233e] font-bold">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open ? (
        <div className="space-y-2 border-t border-[#e5dbd0] bg-[#f5efe7] p-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-xs text-[#85233e]">
              <div>
                <span className="font-extrabold text-[#85233e]">{item.quantity}×</span>{' '}
                <span className="font-semibold">{item.menuItemName}</span>
                {item.variantLabel ? <span className="text-[#85233e] font-medium"> ({item.variantLabel})</span> : null}
                {item.notes ? <p className="text-[11px] text-[#85233e] italic">&ldquo;{item.notes}&rdquo;</p> : null}
              </div>
              <span className="font-bold text-[#85233e]">{formatPrice(item.priceAtOrder * item.quantity)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

