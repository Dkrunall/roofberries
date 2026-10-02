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
    <nav aria-label="Admin navigation" className="-mx-3 sm:-mx-6 mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar px-3 sm:px-6 py-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/admin/dashboard' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold transition-all active:scale-95 ${isActive
                ? 'border border-[#85233e] bg-[#85233e] text-white shadow-sm'
                : 'border border-[#e5dbd0] bg-[#f1eae1] text-[#796b60] hover:border-[#e5dbd0] hover:bg-[#f1eae1] hover:text-[#352c29]'
              }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
