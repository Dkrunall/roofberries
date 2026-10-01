'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchOrderHistory, type OrderHistoryEntry, type OrderHistoryFilter } from '@/lib/data/orderHistory';
import { groupIntoSittings } from '@/lib/sittings';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import { OrderHistoryRow } from './OrderHistoryRow';
import { formatPrice } from '@/lib/format';

/** Live-updating order history: same filters as the server-rendered initial
 *  load, refetched over Realtime whenever any order changes so new orders
 *  and status updates show up here without a manual page reload. */
export function OrderHistoryList({
  initialOrders,
  filter,
}: {
  initialOrders: OrderHistoryEntry[];
  filter: OrderHistoryFilter;
}) {
  const [orders, setOrders] = useState(initialOrders);

  const refetch = useCallback(
    async () => {
      const supabase = createClient();
      try {
        const next = await fetchOrderHistory(supabase, filter);
        setOrders(next);
      } catch (err) {
        console.error('Failed to refresh order history:', err);
      }
    },
    // filter is a fresh object literal from the server component every
    // render — depending on it directly would resubscribe the Realtime
    // channel below on every render instead of only when the actual filter
    // values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter.date, filter.tableNumber]
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-order-history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  useRefetchOnFocus(refetch);

  // Only label sittings when a single table is in view — across all
  // tables, "Sitting 2" would be ambiguous about which table it's for.
  const sittingIndexByOrderId = useMemo(() => {
    if (!filter.tableNumber) return null;
    const sittings = groupIntoSittings(orders, (o) => new Date(o.createdAt).getTime());
    if (sittings.length <= 1) return null;
    const byId = new Map<string, number>();
    sittings.forEach((sitting, i) => {
      for (const order of sitting) byId.set(order.id, i + 1);
    });
    return byId;
  }, [orders, filter.tableNumber]);

  const totalRevenue = orders.reduce((n, o) => n + o.total, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-amber-200/60">
        {orders.length} order{orders.length === 1 ? '' : 's'} · {formatPrice(totalRevenue)} total
      </p>

      <div className="space-y-2">
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-amber-200/50">No orders found for these filters.</p>
        ) : (
          orders.map((order) => (
            <OrderHistoryRow
              key={order.id}
              order={order}
              sittingLabel={sittingIndexByOrderId ? `Sitting ${sittingIndexByOrderId.get(order.id)}` : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
