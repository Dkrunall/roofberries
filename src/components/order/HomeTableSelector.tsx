'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HomeTableSelector() {
  const [tableInput, setTableInput] = useState('1');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(tableInput.trim(), 10);
    if (!isNaN(num) && num > 0) {
      router.push(`/order?table=${num}`);
    }
  }

  const quickTables = [1, 2, 3, 5, 8, 10, 12];

  return (
    <div className="w-full space-y-4 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#1c1814]/90 to-[#110f0d]/95 p-4 sm:p-5 backdrop-blur-xl shadow-2xl gold-glow-sm">
      <div className="space-y-1 text-center">
        <p className="text-xs sm:text-sm font-black tracking-widest text-amber-400 uppercase">
          Welcome Guest
        </p>
        <p className="text-xs font-medium text-amber-200/80">
          Enter or choose your table to access digital ordering
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          <input
            type="number"
            min={1}
            max={500}
            value={tableInput}
            onChange={(e) => setTableInput(e.target.value)}
            placeholder="Table #"
            className="w-24 rounded-2xl border border-amber-500/40 bg-black/80 px-3 py-3 text-center text-base sm:text-lg font-black text-amber-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 shadow-inner transition-all"
            required
          />
          <span className="pointer-events-none absolute -top-2 left-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            TABLE
          </span>
        </div>

        <button
          type="submit"
          className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3.5 px-4 text-xs sm:text-sm font-black text-black shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Open Digital Menu</span>
          <span className="text-base font-extrabold">→</span>
        </button>
      </form>

      <div className="space-y-2 pt-2 border-t border-amber-900/30">
        <p className="text-xs font-bold text-amber-400/80 tracking-wider uppercase text-center">
          Quick Select Table
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {quickTables.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => router.push(`/order?table=${num}`)}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs sm:text-sm font-extrabold text-amber-300 hover:border-amber-400 hover:bg-amber-500/25 active:scale-90 transition-all shadow-sm"
            >
              Table {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

