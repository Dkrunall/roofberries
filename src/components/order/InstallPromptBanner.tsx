'use client';

import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import { BRAND } from '@/lib/brand';

const DISMISSED_KEY = `${BRAND.slug}-install-hint-dismissed`;

/**
 * Android/Chrome shows its own native "install app" affordance automatically
 * once the manifest + service worker criteria are met (see app/manifest.ts,
 * public/sw.js) — no code needed for that. iOS Safari has no equivalent
 * prompt at all; "Add to Home Screen" is a manual Share-sheet action most
 * people never discover on their own. This is that hint, shown once (until
 * dismissed) and only where it's actually needed: iOS, not already
 * installed.
 */
export function InstallPromptBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const dismissed = window.localStorage.getItem(DISMISSED_KEY) === '1';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser APIs (UA sniff, display-mode, localStorage) on mount, not a derived-state cascade
    setShow(isIOS && !isStandalone && !dismissed);
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-[#e5d9cc] bg-white px-4 py-2.5 text-xs text-[#30251f] shadow-sm backdrop-blur-xl">
      <span className="shrink-0 text-base">📲</span>
      <p className="flex-1 leading-snug">
        Add {BRAND.shortName} to your home screen: tap <span className="font-bold text-[#78675c]">Share</span> then{' '}
        <span className="font-bold text-[#78675c]">Add to Home Screen</span>.
      </p>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(DISMISSED_KEY, '1');
          setShow(false);
        }}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-[#85233e] hover:bg-[#f4e6e9] hover:text-[#78675c]"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
