import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/lib/brand';

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-8 bg-[#09090b]">
      {/* Background venue photo */}
      <Image
        src={BRAND.heroImage}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-35 filter brightness-90"
        priority
      />

      {/* Modern dark matte overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-black/70 backdrop-blur-[2px]" />

      {/* Main Luxury Minimal Card Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-[32px] border border-white/10 bg-[#121215]/90 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl my-auto">

        {/* Brand Circular Logo with soft gold ring */}
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 transition-transform duration-500 hover:scale-105">
          <Image
            src={BRAND.logo}
            alt={BRAND.name}
            fill
            sizes="(min-width: 640px) 112px, 96px"
            className="object-cover"
            priority
          />
        </div>

        {/* Brand Title & Tagline */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gold-text">
            {BRAND.name}
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-zinc-400">
            {BRAND.tagline}
          </p>
        </div>

        {/* Informative Guidance Card */}
        <div className="w-full space-y-4 rounded-2xl border border-white/5 bg-zinc-900/60 p-4 text-center">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-zinc-100">
              Scan QR code at your table
            </h2>
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              Order drinks, food, and call for service directly from your phone.
            </p>
          </div>

          {/* Minimal 2x2 Feature Strip */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-left">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-sm">⚡</span>
              <span className="text-[11px] font-medium text-zinc-300">Live Kitchen</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-sm">🍸</span>
              <span className="text-[11px] font-medium text-zinc-300">Cocktails</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-sm">💳</span>
              <span className="text-[11px] font-medium text-zinc-300">Easy Pay</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-sm">🛎️</span>
              <span className="text-[11px] font-medium text-zinc-300">Table Service</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <Link
            href="/order?table=1"
            className="gold-gradient-btn w-full rounded-2xl py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 mt-2"
          >
            <span>Explore Menu</span>
            <span className="text-base font-black">→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}



