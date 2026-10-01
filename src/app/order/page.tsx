import { getActiveTableByNumber } from '@/lib/data/tables';
import { getMenuSections } from '@/lib/data/menu';
import { OrderMessage } from '@/components/order/OrderMessage';
import { MenuBrowser } from '@/components/order/MenuBrowser';

export default async function OrderPage({
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

  const activeTable = await getActiveTableByNumber(tableNumber);
  if (!activeTable) {
    return (
      <OrderMessage
        title="Table not found"
        body={`Table ${tableNumber} isn't available right now. Please ask a staff member for help.`}
      />
    );
  }

  const sections = await getMenuSections();

  return <MenuBrowser tableNumber={tableNumber} sections={sections} />;
}
