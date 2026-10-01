import { OrderShell } from '@/components/order/OrderShell';
import { OrderMessage } from '@/components/order/OrderMessage';
import { CartReview } from '@/components/order/CartReview';

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const { table } = await searchParams;
  const tableNumber = Number(table);

  if (!table || !Number.isInteger(tableNumber) || tableNumber <= 0) {
    return (
      <OrderMessage
        title="Scan the QR code at your table"
        body="This link is missing a table number. Please scan the QR code on your table to start ordering."
      />
    );
  }

  return (
    <OrderShell tableNumber={tableNumber} title="Your order" backHref={`/order?table=${tableNumber}`} showCartBar={false}>
      <CartReview tableNumber={tableNumber} />
    </OrderShell>
  );
}
