import Image from 'next/image';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { HomeTableSelector } from '@/components/order/HomeTableSelector';
import styles from '@/components/order/Terrace.module.css';

export default function Home() {
  return (
    <main className={`${styles.site} ${styles.simpleMenu}`}>
      <header className={styles.simpleNav}><span className={styles.wordmark}>{BRAND.shortName}</span><Link href="/admin/login" className={styles.navLink}>Staff login</Link></header>
      <section className={styles.compactHero}>
        <Image src={BRAND.heroImage} alt="Roofberries terrace" fill sizes="(min-width: 900px) 900px, 100vw" priority className={styles.venueImage} />
        <div className={styles.venueShade} />
        <div className={styles.compactHeroContent}><Image src={BRAND.logo} alt="" width={56} height={56} className={styles.heroLogo} /><div><h1>{BRAND.shortName}</h1><p>Cocktail & Terrace Bar</p></div></div>
      </section>
      <div className={styles.simpleMain}><HomeTableSelector /><p className={styles.helper}>Or scan the QR code at your table.</p></div>
    </main>
  );
}
