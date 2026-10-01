import Link from 'next/link';
import { OrderShell } from '@/components/order/OrderShell';
import { OrderMessage } from '@/components/order/OrderMessage';
import { OrderStatusView } from '@/components/order/OrderStatusView';
import { getOrderForTable } from '@/lib/data/orders';
import { getTableRunningTotal } from '@/lib/data/tableRunningTotal';
import { getFeedbackForOrder } from '@/lib/data/feedback';
import { createClient } from '@/lib/supabase/server';

export default async function OrderStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; order?: string }>;
}) {
  const { table, order: orderId } = await searchParams;
  const tableNumber = Number(table);

  if (!table || !Number.isInteger(tableNumber) || tableNumber <= 0 || !orderId) {
    return (
      <OrderMessage
        title="Scan the QR code at your table"
        body="This link is missing your order details. Please scan the QR code on your table to start ordering."
      />
    );
  }

  const order = await getOrderForTable(orderId, tableNumber);
  if (!order) {
    return (
      <OrderMessage
        title="Order not found"
        body="We couldn't find that order for this table. If you just placed it, ask a staff member to check."
      />
    );
  }

  const feedback = order.status === 'served' ? await getFeedbackForOrder(order.id) : null;
  const supabase = await createClient();
  const runningTotal = await getTableRunningTotal(tableNumber, supabase);

  return (
    <OrderShell tableNumber={tableNumber} title="Order status" showCartBar={false}>
      <OrderStatusView initialOrder={order} hasFeedback={feedback !== null} runningTotal={runningTotal} />
      <Link
        href={`/order?table=${tableNumber}`}
        className="mt-6 block w-full rounded-full border border-card-border py-3 text-center font-semibold"
      >
        Order more
      </Link>
    </OrderShell>
  );
}
