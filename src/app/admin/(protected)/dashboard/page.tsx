import { createClient } from '@/lib/supabase/server';
import { fetchActiveOrders } from '@/lib/data/adminOrders';
import { fetchPendingServiceRequests } from '@/lib/data/serviceRequests';
import { AdminOrdersDashboard } from '@/components/admin/AdminOrdersDashboard';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [initialOrders, initialServiceRequests] = await Promise.all([
    fetchActiveOrders(supabase),
    fetchPendingServiceRequests(supabase),
  ]);

  return <AdminOrdersDashboard initialOrders={initialOrders} initialServiceRequests={initialServiceRequests} />;
}
