import { createClient } from '@/lib/supabase/server';
import type { AdminRole } from '@/types/database';

export interface CurrentAdmin {
  id: string;
  email: string;
  role: AdminRole;
}

/** Returns the signed-in admin, or null if not logged in / not an admin. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle();

  return admin;
}
