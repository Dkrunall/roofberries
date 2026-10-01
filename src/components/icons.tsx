// Shared line-icon set for the customer UI, replacing emoji everywhere —
// matches the stroke style already used for the header's back/search/
// filter/profile icons (viewBox 0 0 24 24, currentColor stroke).
import type { SVGProps } from 'react';

export function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l1 2m0 0 2.2 9.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20.5 8H6" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function WarningIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 2 20h20L12 3Z" />
      <path strokeLinecap="round" d="M12 10v4" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function ClipboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="5.5" y="4" width="13" height="17" rx="2" />
      <path strokeLinecap="round" d="M9 4V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V4M8.5 11h7M8.5 15h7" />
    </svg>
  );
}

export function PotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-5Z" />
      <path strokeLinecap="round" d="M2.5 10h19M7.5 10V7.3a1 1 0 0 1 1-1M16.5 10V7.3a1 1 0 0 0-1-1" />
    </svg>
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9a6 6 0 1 1 12 0c0 4.5 1.6 5.6 1.9 5.9.2.2.1.6-.2.6H4.3c-.3 0-.4-.4-.2-.6C4.4 14.6 6 13.5 6 9Z" />
      <path strokeLinecap="round" d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function SparkleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5c.5 3.2 1.3 5 2.6 6.3 1.3 1.3 3.1 2.1 6.4 2.7-3.3.5-5.1 1.3-6.4 2.6-1.3 1.3-2.1 3.1-2.6 6.4-.5-3.3-1.3-5.1-2.6-6.4-1.3-1.3-3.1-2.1-6.4-2.6 3.3-.6 5.1-1.4 6.4-2.7 1.3-1.3 2.1-3.1 2.6-6.3Z" />
    </svg>
  );
}

export function ForkKnifeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 2.5v6.2a1.8 1.8 0 0 0 3.6 0V2.5M7.8 8.7v12.8" />
      <path strokeLinecap="round" d="M5.7 2.5v4.3M9.9 2.5v4.3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.3 2.5c-1.7 0-3.1 2.1-3.1 5.5s1.4 3.9 3.1 3.9v9.6" />
    </svg>
  );
}

export function BottleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 2.5h4v3.8l1.6 2.4a3 3 0 0 1 .5 1.7v9.6a2 2 0 0 1-2 2h-4.2a2 2 0 0 1-2-2v-9.6a3 3 0 0 1 .5-1.7L10 6.3V2.5Z" />
      <path strokeLinecap="round" d="M9.5 12h5M10 2.5h4" />
    </svg>
  );
}

export function CocktailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16l-8 9-8-9Z" />
      <path strokeLinecap="round" d="M12 13v7.5M8.2 20.5h7.6" />
    </svg>
  );
}

export function MocktailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3h9l-1 17.2a1.5 1.5 0 0 1-1.5 1.4h-4a1.5 1.5 0 0 1-1.5-1.4L7.5 3Z" />
      <path strokeLinecap="round" d="M7.9 8h8.2M15.5 4 20 0.5" />
    </svg>
  );
}

export function CoffeeCupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h13v6.5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9.5h1.2a2.8 2.8 0 0 1 0 5.6H17" />
      <path strokeLinecap="round" d="M8 5.2c0 .9-1 .9-1 1.8M12 5.2c0 .9-1 .9-1 1.8" />
    </svg>
  );
}

export function CupStrawIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.2 8h11.6l-1.1 11.3a2 2 0 0 1-2 1.7H9.3a2 2 0 0 1-2-1.7L6.2 8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14l-1.2-3H6.2L5 8Z" />
      <path strokeLinecap="round" d="M13.5 2.5 12 5.5" />
    </svg>
  );
}

export function CakeSliceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20 12 5l9 15H3Z" />
      <path strokeLinecap="round" d="M7 20v-4.5c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2 1 3 0V20" />
      <circle cx="12" cy="2.3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BellOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9a6 6 0 0 1 8.6-5.4M8.7 4.3A6 6 0 0 1 18 9c0 4.5 1.6 5.6 1.9 5.9.2.2.1.6-.2.6h-3.4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9c0 4.5-1.6 5.6-1.9 5.9-.2.2-.1.6.2.6h9.4" />
      <path strokeLinecap="round" d="M10 19.5a2 2 0 0 0 4 0M3 3l18 18" />
    </svg>
  );
}

export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4h4M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function TableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="3" y="6" width="18" height="4" rx="1" />
      <path strokeLinecap="round" d="M6 10v8M18 10v8" />
    </svg>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.8 20c0-3.4 2.8-6 6.2-6s6.2 2.6 6.2 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 5.3a3.2 3.2 0 0 1 0 6.2M18.4 20c0-2.9-1.9-5.3-4.6-6" />
    </svg>
  );
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5L16.5 3.5Z" />
    </svg>
  );
}

export function StarIcon({ filled = true, ...props }: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinejoin="round" d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7 2.6-5.6Z" />
    </svg>
  );
}

/** Concierge/service bell — used for "Call Waiter", kept visually distinct
 *  from BellIcon (which means "your order is ready" everywhere else). */
export function ConciergeBellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17a8 8 0 0 1 16 0" />
      <path strokeLinecap="round" d="M3 17h18M11 4.5v-1.3M9.3 3.2h3.4" />
      <circle cx="18.5" cy="17" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
