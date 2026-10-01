import { createClient } from '@/lib/supabase/server';

export interface DiningTable {
  id: string;
  tableNumber: number;
  isActive: boolean;
}

/** Looks up an active table by its number, e.g. from ?table=7 in the QR URL. */
export async function getActiveTableByNumber(tableNumber: number): Promise<DiningTable | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tables')
    .select('id, table_number, is_active')
    .eq('table_number', tableNumber)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { id: data.id, tableNumber: data.table_number, isActive: data.is_active };
}
