import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getCurrentAdmin } from '@/lib/data/admin';
import { signOut } from '@/lib/actions/auth';
import { AdminNavBar } from '@/components/admin/AdminNavBar';
import { BRAND } from '@/lib/brand';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const navLinks = [
    { href: '/admin/dashboard', label: 'Live Orders' },
    ...(admin.role === 'manager'
      ? [
        { href: '/admin/menu', label: 'Menu Items' },
        { href: '/admin/tables', label: 'Tables & QR' },
        { href: '/admin/history', label: 'History' },
      ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#09090b]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#09090b]/95 backdrop-blur-2xl shadow-xl">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2.5 sm:gap-4">
            {/* Logo & Brand */}
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-md">
                <Image
                  src={BRAND.logo}
                  alt={`${BRAND.shortName} logo`}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs sm:text-sm font-extrabold tracking-tight text-zinc-100">
                  {BRAND.shortName} Admin
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="truncate text-[10px] uppercase font-bold text-amber-400">
                    {admin.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile info & Sign Out */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden md:inline-block text-xs font-medium text-zinc-400">
                {admin.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-xl border border-white/10 bg-zinc-900 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>

          {/* Horizontally scrollable minimal navigation strip with active route indicator */}
          <AdminNavBar navLinks={navLinks} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 sm:px-6 py-4 sm:py-6">{children}</main>
    </div>
  );
}

