import type { DietaryType } from '@/types/database';

const DOT: Record<DietaryType, string> = {
  veg: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]',
  egg: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]',
  non_veg: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]',
  seafood: 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]',
};

const LABEL: Record<DietaryType, string> = {
  veg: 'Veg',
  egg: 'Egg',
  non_veg: 'Non-Veg',
  seafood: 'Seafood',
};

/** The small minimal veg/non-veg style indicator used on menus. */
export function DietaryBadge({ type }: { type: DietaryType | null }) {
  if (!type) return null;
  return (
    <span
      title={LABEL[type]}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-semibold text-zinc-300"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[type]}`} />
      {LABEL[type]}
    </span>
  );
}

export function AlcoholicBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-950/30 px-2 py-0.5 text-[11px] font-semibold text-purple-300">
      <span className="h-2 w-2 shrink-0 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.6)]" />
      18+ Cocktail
    </span>
  );
}


