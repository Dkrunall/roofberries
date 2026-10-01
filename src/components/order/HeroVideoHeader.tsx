'use client';

import Image from 'next/image';
import { BRAND } from '@/lib/brand';

/** Compact atmospheric venue-photo banner + topbar (table number, staff login). */
export function HeroVideoHeader({
  tableNumber,
  children,
}: {
  tableNumber: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full bg-[#0d0b09] text-white pb-10 mb-2">
      {/* Background venue photo container */}
      <div className="relative h-[62vh] min-h-[440px] w-full overflow-hidden rounded-b-[38px] sm:rounded-b-[48px] border-b border-amber-400/25 shadow-2xl">
        <Image
          src={BRAND.heroImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-80"
          priority
        />

        {/* Dark luxury overlay vignette with amber ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-black/40 to-black/70" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/15 blur-[120px]" />
      </div>

      {/* Floating top bar pinned to viewport */}
      {children ? (
        <div className="fixed inset-x-0 top-0 z-40 mx-auto max-w-lg">
          {children}
        </div>
      ) : null}

      {/* Logo positioned with clean minimal border and gold glow */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-1/2 z-30">
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-full border-[3px] border-amber-400/80 bg-[#0d0b09] shadow-2xl gold-glow transition-transform duration-500 hover:scale-105">
          <Image
            src={BRAND.logo}
            alt={`${BRAND.shortName} logo`}
            fill
            sizes="(min-width: 640px) 96px, 80px"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
