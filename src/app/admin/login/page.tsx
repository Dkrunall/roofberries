import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/data/admin';
import { LoginForm } from '@/components/admin/LoginForm';
import { BRAND } from '@/lib/brand';

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect('/admin/dashboard');
  return (
    <main className="admin-login">
      <section className="admin-login-card">
        <header><Image src={BRAND.logo} alt="" width={56} height={56} priority /><div><h1>{BRAND.shortName}</h1><p>Staff &amp; admin sign in</p></div></header>
        <LoginForm />
        <Link href="/" className="admin-back-link">← Back to Roofberries</Link>
      </section>
    </main>
  );
}
