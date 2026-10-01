'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavLink {
  href: string;
  label: string;
}

export function AdminNavBar({ navLinks }: { navLinks: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-3 sm:-mx-6 mt-2.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar px-3 sm:px-6 py-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/admin/dashboard' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition-all active:scale-95 ${isActive
                ? 'border border-amber-400/50 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'border border-white/5 bg-zinc-900/70 text-zinc-400 hover:border-white/15 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
