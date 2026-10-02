'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import { formatPrice } from '@/lib/format';
import {
  getNotificationPermission,
  isNotificationSupported,
  playReadyChime,
  showBrowserNotification,
  vibrateIfSupported,
} from '@/lib/alerts';
import { BellIcon, BellOffIcon, ClipboardIcon, PotIcon, SparkleIcon } from '@/components/icons';
import { OrderFeedbackForm } from './OrderFeedbackForm';
import { ServiceRequestButtons } from './ServiceRequestButtons';
import { InstallPromptBanner } from './InstallPromptBanner';
import type { OrderView } from '@/lib/data/orders';
import { getTableRunningTotal, type TableRunningTotal } from '@/lib/data/tableRunningTotal';
import { ensurePushSubscription } from '@/lib/push/subscribeClient';
import { subscribeToOrderPush } from '@/lib/actions/push';
import type { OrderStatus } from '@/types/database';
import type { ComponentType, SVGProps } from 'react';
import { BRAND } from '@/lib/brand';

// Safety-net poll, on top of the realtime subscription below — catches the
// rare case where the socket drops without a visibilitychange/focus event
// firing to trigger the refocus resync (e.g. a flaky mobile connection
// while the tab stays foregrounded). Stops once the order is served.
const STATUS_POLL_INTERVAL_MS = 20 * 1000;

const STEPS: { status: OrderStatus; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { status: 'placed', label: 'Order Placed', icon: ClipboardIcon },
  { status: 'preparing', label: 'Preparing', icon: PotIcon },
  { status: 'ready', label: 'Ready', icon: BellIcon },
  { status: 'served', label: 'Served', icon: SparkleIcon },
];

function StatusStepper({ status }: { status: OrderStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex items-center justify-between py-2">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.status} aria-current={isCurrent ? 'step' : undefined} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={`h-[2px] flex-1 ${i === 0 ? 'invisible' : done ? 'bg-[#85233e]' : 'bg-[#e5d9cc]'}`} />
              <div
                className={`relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border transition-all ${done
                    ? 'border-[#e5d9cc] bg-[#85233e] text-white font-extrabold shadow-md'
                    : 'border-[#e5d9cc] bg-[#f5efe6] text-[#78675c]'
                  } ${isCurrent ? 'ring-2 ring-[#85233e]/20 scale-110' : ''}`}
              >
                {done ? <step.icon className="h-4 w-4 sm:h-5 sm:w-5" /> : <span className="text-xs sm:text-sm font-bold">{i + 1}</span>}
              </div>
              <div className={`h-[2px] flex-1 ${i === STEPS.length - 1 ? 'invisible' : i < currentIndex ? 'bg-[#85233e]' : 'bg-[#e5d9cc]'}`} />
            </div>
            <p className={`mt-2 text-[10px] sm:text-xs font-bold text-center ${done ? 'text-[#30251f]' : 'text-[#78675c]'}`}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function OrderStatusView({
  initialOrder,
  hasFeedback = false,
  runningTotal,
}: {
  initialOrder: OrderView;
  hasFeedback?: boolean;
  runningTotal?: TableRunningTotal;
}) {
  const [order, setOrder] = useState(initialOrder);
  const statusRef = useRef(order.status);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported' | null>(null);
  const [liveRunningTotal, setLiveRunningTotal] = useState(runningTotal);

  useEffect(() => {
    try {
      sessionStorage.setItem(`roofberries-order-${order.tableNumber}`, order.id);
    } catch { /* Tracking works even if browser storage is unavailable. */ }
  }, [order.id, order.tableNumber]);

  // Reflects whatever the customer answered at the "Send Order to Kitchen"
  // prompt (see CartReview.tsx) — this page never asks itself, it only
  // shows the resulting state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external browser API on mount, not a derived-state cascade
    setNotificationPermission(isNotificationSupported() ? getNotificationPermission() : 'unsupported');
  }, []);

  // Opportunistically upgrade to real Web Push, which reaches this device
  // even with the tab/browser fully closed — unlike the in-tab
  // Notification API alert above, which only fires while a tab is open.
  // Only runs once permission is already 'granted' (asked for at
  // "Send Order to Kitchen" time, see CartReview.tsx) — this never prompts
  // on its own, and fails silently if unsupported/misconfigured, since the
  // in-tab alert already covers this order regardless.
  useEffect(() => {
    if (notificationPermission !== 'granted') return;
    let cancelled = false;
    ensurePushSubscription().then((sub) => {
      if (!cancelled && sub) void subscribeToOrderPush(order.id, sub);
    });
    return () => {
      cancelled = true;
    };
  }, [notificationPermission, order.id]);

  // Shared by the live subscription below and the refetch fallbacks
  // (refocus + poll) so a status change is announced (chime/vibrate/
  // notification) exactly once no matter which path first learns about it.
  const applyStatusUpdate = useCallback(
    (next: { status: OrderStatus; served_at: string | null }) => {
      if (next.status === 'ready' && statusRef.current !== 'ready') {
        playReadyChime();
        vibrateIfSupported([200, 100, 200]);
        // Same tag as the Web Push notification for this order (see
        // lib/push/notify.ts) — if both arrive (tab open when the push
        // lands), the OS replaces rather than stacks them.
        showBrowserNotification(
          'Your order is ready!',
          `Table ${order.tableNumber} — head to your table, staff is on the way.`,
          `order-ready-${order.id}`
        );
      }
      statusRef.current = next.status;
      setOrder((prev) => (prev.status === next.status && prev.servedAt === next.served_at ? prev : { ...prev, status: next.status, servedAt: next.served_at }));
    },
    [order.tableNumber, order.id]
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-status-${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload) => {
          applyStatusUpdate(payload.new as { status: OrderStatus; served_at: string | null });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, applyStatusUpdate]);

  // Realtime doesn't replay events missed while this tab's websocket was
  // suspended — which mobile browsers do aggressively in the background —
  // so a customer who locks their phone while waiting can come back to a
  // status screen that's silently stuck on "Preparing" even though the
  // kitchen marked it ready minutes ago. Resync on refocus, plus a light
  // poll as a fallback for drops that don't fire a focus/visibility event.
  const refetchStatus = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.from('orders').select('status, served_at').eq('id', order.id).maybeSingle();
      if (error) throw error;
      if (data) applyStatusUpdate(data);
    } catch (err) {
      console.error('Failed to refresh order status:', err);
    }
  }, [order.id, applyStatusUpdate]);

  // The running total ("Table N total so far") was previously fetched once
  // server-side at page load and never touched again — it kept showing a
  // stale count/amount if another guest at the table placed a second order
  // while this screen stayed open, despite everything else on this page
  // being "live". Refetch it alongside the order status on the same
  // triggers (refocus, poll, and — since a second order changes this,
  // not this order's own status — a realtime subscription scoped to every
  // order at this table, not just this one).
  const hasRunningTotal = runningTotal !== undefined;
  const refetchRunningTotal = useCallback(async () => {
    if (!hasRunningTotal) return;
    const supabase = createClient();
    try {
      const next = await getTableRunningTotal(order.tableNumber, supabase);
      setLiveRunningTotal(next);
    } catch (err) {
      console.error('Failed to refresh table running total:', err);
    }
  }, [order.tableNumber, hasRunningTotal]);

  const [tableId, setTableId] = useState<string | null>(null);
  useEffect(() => {
    if (!hasRunningTotal) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('tables')
      .select('id')
      .eq('table_number', order.tableNumber)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setTableId(data.id);
      });
    return () => {
      cancelled = true;
    };
  }, [order.tableNumber, hasRunningTotal]);

  useEffect(() => {
    if (!tableId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`table-running-total-${tableId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `table_id=eq.${tableId}` },
        () => refetchRunningTotal()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, refetchRunningTotal]);

  const refetchAll = useCallback(() => {
    refetchStatus();
    refetchRunningTotal();
  }, [refetchStatus, refetchRunningTotal]);

  useRefetchOnFocus(refetchAll);

  useEffect(() => {
    if (order.status === 'served') return;
    const interval = setInterval(refetchAll, STATUS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [order.status, refetchAll]);

  const total = order.items.reduce((n, i) => n + i.priceAtOrder * i.quantity, 0);

  return (
    <div className="space-y-6 pb-8">
      <InstallPromptBanner />

      {/* Main status tracking card */}
      <div className="overflow-hidden rounded-3xl border border-[#e5d9cc] bg-white p-6 shadow-sm space-y-6 ">
        <div className="flex items-center justify-between border-b border-[#e5d9cc] pb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-[#85233e] uppercase">Your table order</p>
            <h2 className="text-lg font-semibold text-[#30251f]">Order #{order.id.slice(0, 8)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-[#e5d9cc] bg-[#f4e6e9] px-3.5 py-1 text-xs font-semibold text-[#85233e] ">
              <span className="h-2 w-2 rounded-full bg-[#85233e] " />
              <span>Tracking</span>
            </div>
            {notificationPermission === 'granted' ? (
              <div
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800"
                title="You'll get a notification the moment your order is ready"
              >
                <BellIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Alerts On</span>
              </div>
            ) : notificationPermission === 'denied' ? (
              <div
                className="flex items-center gap-1.5 rounded-full border border-[#e5d9cc] bg-[#f5efe6] px-3 py-1 text-xs font-semibold text-[#78675c]"
                title="Notifications blocked — enable them in your browser's site settings"
              >
                <BellOffIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Alerts Off</span>
              </div>
            ) : null}
          </div>
        </div>

        <StatusStepper status={order.status} />

        {notificationPermission === 'denied' ? (
          <p className="-mt-2 flex items-center gap-1.5 text-[11px] text-[#78675c]">
            <BellOffIcon className="h-3 w-3 shrink-0" />
            Keep this page open for order updates.
          </p>
        ) : null}

        <div role="status" aria-live="polite" className="rounded-2xl border border-[#e5d9cc] bg-[#f5efe6] p-4 text-center ">
          {order.status === 'served' ? (
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-base font-semibold text-[#85233e]">
                <SparkleIcon className="h-4 w-4" />
                Order Served!
              </p>
              <p className="text-xs text-[#78675c] font-medium">Thank you for dining with {BRAND.name}. Enjoy your meal!</p>
            </div>
          ) : order.status === 'ready' ? (
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-base font-semibold text-[#85233e] animate-pulse">
                <BellIcon className="h-4 w-4" />
                Your Order is Ready!
              </p>
              <p className="text-xs text-[#78675c] font-medium">Our staff is serving your items to Table {order.tableNumber}.</p>
            </div>
          ) : order.status === 'preparing' ? (
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-base font-semibold text-[#78675c]">
                <PotIcon className="h-4 w-4" />
                Freshly preparing
              </p>
              <p className="text-xs text-[#78675c] font-medium">Your food is on its way from our kitchen.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-base font-semibold text-[#78675c]">
                <ClipboardIcon className="h-4 w-4" />
                Order received
              </p>
              <p className="text-xs text-[#78675c] font-medium">We&rsquo;ll update this screen live as your order progresses.</p>
            </div>
          )}
        </div>
      </div>

      {/* Call Waiter / Request Bill */}
      <ServiceRequestButtons tableNumber={order.tableNumber} />

      {/* Order receipt details */}
      <div className="rounded-3xl border border-[#e5d9cc] bg-white p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e5d9cc] pb-3">
          <h3 className="text-xs font-semibold tracking-widest text-[#85233e] uppercase">Order Summary</h3>
          <span className="text-xs text-[#78675c] font-bold">Table {order.tableNumber}</span>
        </div>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 border-b border-[#e5d9cc] pb-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#30251f]">
                  {item.quantity} × {item.menuItemName}
                </p>
                {item.variantLabel ? (
                  <p className="text-xs text-[#85233e] font-bold">{item.variantLabel}</p>
                ) : null}
                {item.notes ? (
                  <p className="text-xs text-[#78675c] italic">&ldquo;{item.notes}&rdquo;</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm font-semibold text-[#85233e]">
                {formatPrice(item.priceAtOrder * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 text-base font-semibold text-[#30251f]">
          <span>Order total</span>
          <span className="text-[#85233e] text-xl font-semibold">{formatPrice(total)}</span>
        </div>

        {liveRunningTotal && liveRunningTotal.orderCount > 1 ? (
          <div className="flex items-center justify-between border-t border-[#e5d9cc] pt-3 text-xs">
            <span className="text-[#78675c] font-semibold">
              Table {order.tableNumber} total so far ({liveRunningTotal.orderCount} orders)
            </span>
            <span className="font-semibold text-[#78675c]">{formatPrice(liveRunningTotal.totalAmount)}</span>
          </div>
        ) : null}
      </div>

      {order.status === 'served' && !hasFeedback ? <OrderFeedbackForm orderId={order.id} /> : null}
    </div>
  );
}


