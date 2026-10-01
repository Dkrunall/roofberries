import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, OrderStatus } from '@/types/database';

export interface OrderHistoryItem {
  id: string;
  menuItemName: string;
  variantLabel: string | null;
  quantity: number;
  notes: string | null;
  priceAtOrder: number;
}

export interface OrderHistoryEntry {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdAt: string;
  servedAt: string | null;
  items: OrderHistoryItem[];
  total: number;
}

export interface OrderHistoryFilter {
  /** 'YYYY-MM-DD' in the server's local date, or undefined for all dates. */
  date?: string;
  tableNumber?: number;
}

/**
 * Shared between the history page's initial server-side load and its
 * client-side Realtime refetches, same pattern as fetchActiveOrders — both
 * pass a Supabase client typed against the same Database, just sourced
 * differently (cookie-based server client vs. browser client).
 */
export async function fetchOrderHistory(
  supabase: SupabaseClient<Database>,
  filter: OrderHistoryFilter
): Promise<OrderHistoryEntry[]> {
  let query = supabase
    .from('orders')
    .select(
      `id, status, created_at, served_at, tables!inner ( table_number ),
       order_items ( id, quantity, notes, price_at_order, menu_items ( name ), menu_item_variants ( label ) )`
    )
    .order('created_at', { ascending: false });

  if (filter.date) {
    // "server's local date" in practice means IST (this is an India-facing
    // venue — en-IN currency/locale throughout) — India doesn't observe
    // DST, so a fixed +05:30 offset is always correct, not just an
    // approximation. Parsing with an explicit offset (rather than a bare
    // "...Z" UTC-midnight boundary) means an order placed at, say, 1am IST
    // lands in *that* IST calendar day instead of spilling into the
    // previous UTC day.
    const start = new Date(`${filter.date}T00:00:00+05:30`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
  }
  if (filter.tableNumber) {
    query = query.eq('tables.table_number', filter.tableNumber);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((o) => {
    const items: OrderHistoryItem[] = (o.order_items ?? []).map((i) => ({
      id: i.id,
      menuItemName: i.menu_items?.name ?? 'Item',
      variantLabel: i.menu_item_variants?.label ?? null,
      quantity: i.quantity,
      notes: i.notes,
      priceAtOrder: Number(i.price_at_order),
    }));
    return {
      id: o.id,
      tableNumber: o.tables.table_number,
      status: o.status,
      createdAt: o.created_at,
      servedAt: o.served_at,
      items,
      total: items.reduce((n, i) => n + i.priceAtOrder * i.quantity, 0),
    };
  });
}
