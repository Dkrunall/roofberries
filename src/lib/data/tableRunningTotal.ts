import type { SupabaseClient } from '@supabase/supabase-js';
import { groupIntoSittings } from '@/lib/sittings';
import type { Database } from '@/types/database';

export interface TableRunningTotal {
  totalAmount: number;
  orderCount: number;
}

/**
 * Used by the customer status screen's optional "running total" display —
 * scoped to the table's current sitting only (see lib/sittings.ts), not
 * every order ever placed at this table number.
 *
 * Kept in its own file (no server-only imports) rather than alongside
 * getOrderForTable in lib/data/orders.ts, specifically so it can be
 * value-imported from a client component (OrderStatusView, for live
 * refetches as other orders come in) without pulling that file's
 * `next/headers`-based server client into the client bundle. Takes an
 * explicit client (same pattern as fetchActiveOrders/fetchOrderHistory) so
 * the status page's initial server-rendered total and its live
 * client-side refetches share one implementation.
 */
export async function getTableRunningTotal(
  tableNumber: number,
  supabase: SupabaseClient<Database>
): Promise<TableRunningTotal> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, tables!inner(table_number), order_items(quantity, price_at_order)')
    .eq('tables.table_number', tableNumber);
  if (error) throw error;

  const sittings = groupIntoSittings(data ?? [], (o) => new Date(o.created_at).getTime());
  const currentSitting = sittings[sittings.length - 1] ?? [];

  let totalAmount = 0;
  for (const order of currentSitting) {
    for (const item of order.order_items ?? []) {
      totalAmount += Number(item.price_at_order) * item.quantity;
    }
  }

  return { totalAmount, orderCount: currentSitting.length };
}
