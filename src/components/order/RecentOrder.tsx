'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function RecentOrder({ tableNumber }: { tableNumber: number }) {
  const [orderId, setOrderId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`roofberries-order-${tableNumber}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser session storage after hydration
      setOrderId(saved);
    } catch { /* Storage is optional. */ }
  }, [tableNumber]);

  return (
    <div className="rounded-3xl border border-[#e5d9cc] bg-white p-8 text-center">
      <h2 className="text-xl font-semibold">{orderId ? 'Your latest order' : 'No order to track yet'}</h2>
      <p className="mt-2 text-sm text-[#78675c]">{orderId ? 'See how your order is coming along.' : 'Once you place an order, follow its progress here.'}</p>
      <Link href={orderId ? `/order/status?table=${tableNumber}&order=${encodeURIComponent(orderId)}` : `/order?table=${tableNumber}`} className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-[#85233e] px-6 text-sm font-semibold text-white">
        {orderId ? 'Track order →' : 'Browse menu →'}
      </Link>
    </div>
  );
}
