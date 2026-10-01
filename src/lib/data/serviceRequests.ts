import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ServiceRequestStatus, ServiceRequestType } from '@/types/database';

export interface ServiceRequestView {
  id: string;
  tableNumber: number;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  createdAt: string;
}

/**
 * Shared between the dashboard's initial server-side load and its
 * client-side Realtime refetches, same pattern as fetchActiveOrders.
 */
export async function fetchPendingServiceRequests(supabase: SupabaseClient<Database>): Promise<ServiceRequestView[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('id, type, status, created_at, tables ( table_number )')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    tableNumber: r.tables.table_number,
    type: r.type,
    status: r.status,
    createdAt: r.created_at,
  }));
}
