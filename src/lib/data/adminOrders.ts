import type { SupabaseClient } from '@supabase/supabase-js';
import { groupIntoSittings } from '@/lib/sittings';
import type { Database, OrderStatus } from '@/types/database';

export interface AdminOrderItem {
  id: string;
  menuItemName: string;
  variantLabel: string | null;
  quantity: number;
  notes: string | null;
  priceAtOrder: number;
  /** Per-item kitchen status — the order's own `status` is derived from
   *  these (see 0011_order_item_status.sql), not set directly. */
  status: OrderStatus;
}

export interface AdminOrder {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdAt: string;
  servedAt: string | null;
  items: AdminOrderItem[];
}

/**
 * Shared between the dashboard's initial server-side load and its
 * client-side Realtime refetches — takes either Supabase client since both
 * are typed against the same Database.
 */
export async function fetchActiveOrders(supabase: SupabaseClient<Database>): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, status, created_at, served_at, tables ( table_number ),
       order_items ( id, quantity, notes, price_at_order, status, menu_items ( name ), menu_item_variants ( label ) )`
    )
    .neq('status', 'served')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((o) => ({
    id: o.id,
    tableNumber: o.tables.table_number,
    status: o.status,
    createdAt: o.created_at,
    servedAt: o.served_at,
    items: (o.order_items ?? []).map((i) => ({
      id: i.id,
      menuItemName: i.menu_items?.name ?? 'Item',
      variantLabel: i.menu_item_variants?.label ?? null,
      quantity: i.quantity,
      notes: i.notes,
      priceAtOrder: Number(i.price_at_order),
      status: i.status,
    })),
  }));
}

export interface TableGroup {
  tableNumber: number;
  /** This table's active orders split into sittings (see lib/sittings.ts)
   *  — usually just one, but a table that ordered, went quiet for 90+
   *  minutes, then ordered again shows as two, oldest sitting first. */
  sittings: AdminOrder[][];
}

/** Groups an already time-sorted order list by table (preserving group
 *  order — tables with the longest-waiting order come first), then splits
 *  each table's orders into sittings. */
export function groupOrdersByTable(orders: AdminOrder[]): TableGroup[] {
  const order: number[] = [];
  const byTable = new Map<number, AdminOrder[]>();
  for (const o of orders) {
    if (!byTable.has(o.tableNumber)) {
      byTable.set(o.tableNumber, []);
      order.push(o.tableNumber);
    }
    byTable.get(o.tableNumber)!.push(o);
  }
  return order.map((tableNumber) => ({
    tableNumber,
    sittings: groupIntoSittings(byTable.get(tableNumber)!, (o) => new Date(o.createdAt).getTime()),
  }));
}
