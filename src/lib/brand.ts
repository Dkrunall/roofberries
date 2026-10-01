/**
 * Outlet branding — the one place to change venue name, logo and imagery.
 * Theme colors live in src/app/globals.css (the `amber` palette is remapped
 * to Roofberries' raspberry red there); PWA icons are generated from
 * `logo` by scripts/generate-pwa-icons.js.
 */
export const BRAND = {
  name: 'Roofberries Cocktail Bar',
  shortName: 'Roofberries',
  tagline: 'Cocktail & Terrace Bar · Cruisin in Paradise',
  description: 'Scan, order, enjoy — table ordering for Roofberries Cocktail Bar.',
  /** Square logo, shown in a circular frame. */
  logo: '/roofberries-logo.jpg',
  /** Venue photo behind the home page and menu header. */
  heroImage: '/roofberries-hero.jpg',
  /** Prefix for localStorage keys and downloaded file names. */
  slug: 'roofberries',
  /** Matches --background in globals.css; used for the PWA splash/theme. */
  themeColor: '#09090b',
} as const;
