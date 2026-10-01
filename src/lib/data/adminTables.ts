import { createClient } from '@/lib/supabase/server';

export interface AdminTable {
  id: string;
  tableNumber: number;
  isActive: boolean;
}

export async function getAllTables(): Promise<AdminTable[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tables')
    .select('id, table_number, is_active')
    .order('table_number', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => ({ id: t.id, tableNumber: t.table_number, isActive: t.is_active }));
}
