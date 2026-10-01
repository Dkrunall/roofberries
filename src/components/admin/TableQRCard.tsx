'use client';

import { useEffect, useState, useTransition } from 'react';
import QRCode from 'qrcode';
import { setTableActive, deleteTable } from '@/lib/actions/tables';
import type { AdminTable } from '@/lib/data/adminTables';
import { BRAND } from '@/lib/brand';

export function TableQRCard({ table }: { table: AdminTable }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/order?table=${table.tableNumber}`;
    QRCode.toDataURL(url, { margin: 1, width: 240 }).then((d) => {
      if (!cancelled) setDataUrl(d);
    });
    return () => {
      cancelled = true;
    };
  }, [table.tableNumber]);

  function handleToggleActive() {
    startTransition(async () => {
      try {
        await setTableActive(table.id, !table.isActive);
      } catch (err) {
        window.alert(err instanceof Error && err.message ? err.message : 'Failed to update table.');
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete Table ${table.tableNumber}? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteTable(table.id);
      } catch (err) {
        window.alert(err instanceof Error && err.message ? err.message : 'Failed to delete table.');
      }
    });
  }

  return (
    <div className={`flex flex-col items-center gap-2.5 sm:gap-3 rounded-2xl border p-3.5 sm:p-4 shadow-lg transition-all ${
      !table.isActive
        ? 'opacity-40 border-white/5 bg-black/20'
        : 'border-white/10 bg-[#121215] hover:border-amber-400/40'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${table.isActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        <p className="font-bold text-zinc-100 text-sm">Table {table.tableNumber}</p>
      </div>

      {dataUrl ? (
        <div className="p-2 rounded-xl bg-white shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={`QR code for table ${table.tableNumber}`}
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
          />
        </div>
      ) : (
        <div className="h-20 w-20 sm:h-24 sm:w-24 animate-pulse rounded-xl bg-zinc-900 border border-white/5" />
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs font-semibold">
        {dataUrl ? (
          <a
            href={dataUrl}
            download={`${BRAND.slug}-table-${table.tableNumber}-qr.png`}
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            Save QR
          </a>
        ) : null}
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={isPending}
          className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {table.isActive ? 'Disable' : 'Enable'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

