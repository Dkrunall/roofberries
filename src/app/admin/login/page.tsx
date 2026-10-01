import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getCurrentAdmin } from '@/lib/data/admin';
import { LoginForm } from '@/components/admin/LoginForm';
import { BRAND } from '@/lib/brand';

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect('/admin/dashboard');

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-12 bg-gradient-to-b from-[#0f0d0b] via-[#161310] to-[#0a0908]">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm space-y-6 glass-panel p-8 rounded-3xl border border-amber-500/20 shadow-2xl gold-glow">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-amber-500/30 shadow-lg">
            <Image
              src={BRAND.logo}
              alt={`${BRAND.shortName} logo`}
              fill
              sizes="80px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold gold-text-gradient">{BRAND.name}</h1>
            <p className="text-xs text-amber-200/60 font-medium">Staff &amp; Admin Portal</p>
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}

