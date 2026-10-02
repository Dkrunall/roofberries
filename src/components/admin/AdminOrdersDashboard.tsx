'use client';

import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchActiveOrders, groupOrdersByTable, type AdminOrder, type AdminOrderItem } from '@/lib/data/adminOrders';
import { fetchPendingServiceRequests, type ServiceRequestView } from '@/lib/data/serviceRequests';
import { advanceOrderItems, updateOrderItemStatus } from '@/lib/actions/adminOrders';
import { acknowledgeServiceRequest } from '@/lib/actions/serviceRequests';
import { NEXT_STATUS, ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/format';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import {
  getNotificationPermission,
  isNotificationSupported,
  playNewOrderChime,
  playServiceRequestChime,
  playStaleOrderChime,
  primeAudio,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/lib/alerts';
import { BellIcon, BellOffIcon, CheckIcon, ConciergeBellIcon, DocumentIcon, WarningIcon } from '@/components/icons';
import type { ServiceRequestType } from '@/types/database';

const STALE_THRESHOLD_MS = 8 * 60 * 1000;
const STALE_REALERT_MS = 60 * 1000;
const STALE_CHECK_INTERVAL_MS = 15 * 1000;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

const STATUS_STYLE: Record<string, string> = {
  placed: 'border-rose-500/40 bg-rose-500/10 text-rose-700',
  preparing: 'border-amber-500/40 bg-amber-500/10 text-[#85233e]',
  ready: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
  served: 'border-[#e5dbd0] bg-[#f1eae1] text-[#796b60]',
};

/** Per-item advance control — lets staff move one dish/drink forward
 *  independently of the rest of the order (a poured drink is done in
 *  seconds, a plated dish can take 20 minutes). The order's own status
 *  pill above is a read-only aggregate, kept in sync by a DB trigger. */
function ItemStatusButton({ item }: { item: AdminOrderItem }) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useOptimistic(item.status);
  const nextStatus = NEXT_STATUS[localStatus];

  function handleAdvance() {
    if (!nextStatus) return;
    startTransition(async () => {
      setLocalStatus(nextStatus);
      try {
        await updateOrderItemStatus(item.id, nextStatus);
      } catch {
        // localStatus reverts automatically on failure
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleAdvance}
      disabled={isPending || !nextStatus}
      title={nextStatus ? `Mark ${ORDER_STATUS_LABEL[nextStatus]}` : 'Served'}
      className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${STATUS_STYLE[localStatus] ?? ''
        } ${nextStatus ? 'hover:scale-[1.03] active:scale-95 cursor-pointer' : 'cursor-default opacity-80'} disabled:cursor-wait`}
    >
      {isPending ? '…' : ORDER_STATUS_LABEL[localStatus]}
    </button>
  );
}

function OrderCard({ order, soundOn }: { order: AdminOrder; soundOn: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useOptimistic(order.status);
  const nextStatus = NEXT_STATUS[localStatus];
  const total = order.items.reduce((n, i) => n + i.priceAtOrder * i.quantity, 0);

  const [now, setNow] = useState(() => Date.now());
  const lastStaleAlertRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), STALE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const waitingMs = now - new Date(order.createdAt).getTime();
  const isStale = localStatus === 'placed' && waitingMs > STALE_THRESHOLD_MS;

  useEffect(() => {
    if (!isStale) return;
    if (now - lastStaleAlertRef.current < STALE_REALERT_MS) return;
    lastStaleAlertRef.current = now;
    if (soundOn) playStaleOrderChime();
  }, [isStale, now, soundOn]);

  function handleAdvance() {
    if (!nextStatus) return;
    startTransition(async () => {
      setLocalStatus(nextStatus);
      try {
        // Bulk convenience for "everything's at the same stage, bump it
        // all forward" — internally per-item (see advanceOrderItems), so
        // it can't drift out of sync with the individual item controls
        // below.
        await advanceOrderItems(order.id);
      } catch {
        // localStatus reverts automatically on failure
      }
    });
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border p-4 transition-all shadow-lg ${isStale
          ? 'border-rose-500/80 bg-rose-50 ring-2 ring-rose-500/40 animate-pulse'
          : 'border-[#e5dbd0] bg-[#fffdf9] hover:border-[#e5dbd0]'
        }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[localStatus] ?? ''}`}>
          {ORDER_STATUS_LABEL[localStatus]}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-[#796b60]">#{order.id.slice(0, 6)}</span>
          <span className={`flex items-center gap-1 text-xs font-semibold ${isStale ? 'text-rose-700' : 'text-[#796b60]'}`}>
            {isStale ? <WarningIcon className="h-3.5 w-3.5" /> : null}
            {timeAgo(order.createdAt)}
          </span>
        </div>
      </div>

      <ul className="mb-4 space-y-2 border-y border-[#e5dbd0] py-2.5">
        {order.items.map((item) => (
          <li key={item.id} className="text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-bold text-[#352c29]">
                  <span className="text-[#85233e] font-extrabold">{item.quantity}×</span> {item.menuItemName}
                </span>
                {item.variantLabel ? (
                  <span className="ml-1.5 rounded-md bg-[#f1eae1] px-1.5 py-0.5 text-[10px] font-medium text-[#5c4e44]">
                    {item.variantLabel}
                  </span>
                ) : null}
                {item.notes ? (
                  <p className="mt-1 text-[11px] italic text-[#85233e] font-medium">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                ) : null}
              </div>
              <ItemStatusButton item={item} />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#352c29]">
          Total: <strong className="text-[#85233e]">{formatPrice(total)}</strong>
        </span>
        {nextStatus ? (
          <button
            type="button"
            onClick={handleAdvance}
            disabled={isPending}
            className="gold-gradient-btn rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
          >
            {isPending ? 'Updating...' : `Mark ${ORDER_STATUS_LABEL[nextStatus]}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

const SERVICE_REQUEST_LABEL: Record<ServiceRequestType, { label: string; icon: typeof ConciergeBellIcon }> = {
  call_waiter: { label: 'Call Waiter', icon: ConciergeBellIcon },
  request_bill: { label: 'Request Bill', icon: DocumentIcon },
};

function ServiceRequestCard({ request, onAcknowledge }: { request: ServiceRequestView; onAcknowledge: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const { label, icon: Icon } = SERVICE_REQUEST_LABEL[request.type];

  function handleAcknowledge() {
    startTransition(async () => {
      try {
        await acknowledgeServiceRequest(request.id);
        onAcknowledge(request.id);
      } catch {
        // leave it in the list — the admin can just try again
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e5dbd0] bg-[#fffdf9] px-4 py-3 shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-[#85233e] border border-amber-500/20">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#352c29]">
            Table {request.tableNumber} · {label}
          </p>
          <p className="text-xs text-[#796b60]">{timeAgo(request.createdAt)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleAcknowledge}
        disabled={isPending}
        className="gold-gradient-btn flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all cursor-pointer"
      >
        <CheckIcon className="h-3.5 w-3.5" />
        {isPending ? 'Clearing...' : 'Done'}
      </button>
    </div>
  );
}

type NotificationState = NotificationPermission | 'unsupported' | null;

function AlertsControl({ soundOn, onToggleSound }: { soundOn: boolean; onToggleSound: (on: boolean) => void }) {
  const [permission, setPermission] = useState<NotificationState>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external browser API on mount, not a derived-state cascade
    setPermission(isNotificationSupported() ? getNotificationPermission() : 'unsupported');
  }, []);

  async function handleEnableNotifications() {
    primeAudio();
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      <button
        type="button"
        onClick={() => {
          primeAudio();
          onToggleSound(!soundOn);
        }}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all ${soundOn
            ? 'border-amber-500/40 bg-amber-500/10 text-[#85233e]'
            : 'border-[#e5dbd0] bg-[#f5efe7] text-[#85233e]'
          }`}
      >
        {soundOn ? <BellIcon className="h-3.5 w-3.5" /> : <BellOffIcon className="h-3.5 w-3.5" />}
        {soundOn ? 'Chime Alerts Enabled' : 'Chimes Muted'}
      </button>

      {permission !== null && permission !== 'unsupported' && permission !== 'granted' ? (
        <button
          type="button"
          onClick={handleEnableNotifications}
          className="rounded-xl border border-amber-500/30 bg-[#f5efe7] px-3 py-1.5 text-[#85233e] hover:bg-amber-500/10 transition-colors"
        >
          Enable Desktop Alerts
        </button>
      ) : null}
      {permission === 'denied' ? (
        <span className="text-[11px] text-[#85233e]">Desktop notifications blocked in browser</span>
      ) : null}
    </div>
  );
}

export function AdminOrdersDashboard({
  initialOrders,
  initialServiceRequests,
}: {
  initialOrders: AdminOrder[];
  initialServiceRequests: ServiceRequestView[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [serviceRequests, setServiceRequests] = useState(initialServiceRequests);
  const [soundOn, setSoundOn] = useState(true);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const knownServiceRequestIdsRef = useRef<Set<string> | null>(null);
  const soundOnRef = useRef(soundOn);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    try {
      const next = await fetchActiveOrders(supabase);

      if (knownOrderIdsRef.current) {
        const newlyPlaced = next.filter((o) => o.status === 'placed' && !knownOrderIdsRef.current!.has(o.id));
        if (newlyPlaced.length > 0) {
          if (soundOnRef.current) playNewOrderChime();
          for (const order of newlyPlaced) {
            showBrowserNotification(
              `New order — Table ${order.tableNumber}`,
              order.items.map((i) => `${i.quantity}× ${i.menuItemName}`).join(', ')
            );
          }
        }
      }
      knownOrderIdsRef.current = new Set(next.map((o) => o.id));
      setOrders(next);
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    }
  }, []);

  const refetchServiceRequests = useCallback(async () => {
    const supabase = createClient();
    try {
      const next = await fetchPendingServiceRequests(supabase);

      if (knownServiceRequestIdsRef.current) {
        const newlyRaised = next.filter((r) => !knownServiceRequestIdsRef.current!.has(r.id));
        if (newlyRaised.length > 0) {
          if (soundOnRef.current) playServiceRequestChime();
          for (const request of newlyRaised) {
            showBrowserNotification(
              `Table ${request.tableNumber} — ${SERVICE_REQUEST_LABEL[request.type].label}`,
              'Tap to view on the live orders board.'
            );
          }
        }
      }
      knownServiceRequestIdsRef.current = new Set(next.map((r) => r.id));
      setServiceRequests(next);
    } catch (err) {
      console.error('Failed to refresh service requests:', err);
    }
  }, []);

  useEffect(() => {
    knownOrderIdsRef.current = new Set(initialOrders.map((o) => o.id));
    knownServiceRequestIdsRef.current = new Set(initialServiceRequests.map((r) => r.id));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refetch();
      })
      // Per-item status changes don't always change the parent order's own
      // (least-advanced-item) status — e.g. marking one of three items
      // "ready" while the other two are still "preparing" leaves the
      // order's aggregate status unchanged, so the `orders` subscription
      // above wouldn't fire. Watch order_items directly too, so every
      // per-item update from any staff device shows up here live.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        refetchServiceRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchServiceRequests]);

  // Belt-and-suspenders for the above: if this tablet/phone was
  // backgrounded (screen locked, app-switched) for long enough that its
  // realtime socket got suspended, a status change that happened during
  // that window would otherwise never arrive — Realtime doesn't replay
  // missed events on reconnect. Force a resync on refocus.
  useRefetchOnFocus(
    useCallback(() => {
      refetch();
      refetchServiceRequests();
    }, [refetch, refetchServiceRequests])
  );

  function handleAcknowledgeRequest(id: string) {
    setServiceRequests((prev) => prev.filter((r) => r.id !== id));
  }

  const groups = groupOrdersByTable(orders);
  const placedCount = orders.filter((o) => o.status === 'placed').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-[#e5dbd0] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#352c29]">Live Orders</h1>
            <p className="text-xs sm:text-sm text-[#796b60]">Real-time table orders from dining area</p>
          </div>
          <AlertsControl soundOn={soundOn} onToggleSound={setSoundOn} />
        </div>

        {groups.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-[#85233e]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {groups.length} table{groups.length === 1 ? '' : 's'} active
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-[#e5dbd0] bg-[#f1eae1] px-3 py-1 text-xs font-semibold text-[#5c4e44]">
              {orders.length} order{orders.length === 1 ? '' : 's'} in progress
            </span>
            {placedCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700">
                {placedCount} awaiting kitchen
              </span>
            ) : null}
            {readyCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                {readyCount} ready to serve
              </span>
            ) : null}
            {serviceRequests.length > 0 ? (
              <span className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700">
                {serviceRequests.length} request{serviceRequests.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {serviceRequests.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-[#796b60] uppercase">Table Service Requests</h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {serviceRequests.map((request) => (
              <ServiceRequestCard key={request.id} request={request} onAcknowledge={handleAcknowledgeRequest} />
            ))}
          </div>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="mx-auto my-12 flex max-w-md flex-col items-center gap-3 rounded-2xl p-10 text-center border border-[#e5dbd0] bg-[#fffdf9]">
          <BellIcon className="h-9 w-9 text-[#796b60]" />
          <h2 className="text-base font-bold text-[#352c29]">No Active Orders</h2>
          <p className="text-xs text-[#796b60]">
            Incoming table orders will appear here automatically with live alerts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const totalOrders = group.sittings.reduce((n, s) => n + s.length, 0);
            const hasMultipleSittings = group.sittings.length > 1;
            return (
              <div key={group.tableNumber} className="rounded-2xl border border-[#e5dbd0] bg-[#fffdf9] p-4 space-y-3 shadow-xl transition-colors hover:border-[#e5dbd0]">
                <div className="flex items-center justify-between border-b border-[#e5dbd0] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    <h2 className="text-base font-bold text-[#352c29]">
                      Table {group.tableNumber}
                    </h2>
                  </div>
                  <span className="rounded-lg border border-[#e5dbd0] bg-[#f1eae1] px-2.5 py-0.5 text-xs font-semibold text-[#5c4e44]">
                    {totalOrders} order{totalOrders === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.sittings.map((sitting, i) => (
                    <div key={sitting[0]?.id ?? i} className="space-y-2.5">
                      {hasMultipleSittings ? (
                        <div className="flex items-center gap-2">
                          <span className="h-px flex-1 bg-[#f1eae1]" />
                          <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                            Sitting {i + 1}
                          </span>
                          <span className="h-px flex-1 bg-[#f1eae1]" />
                        </div>
                      ) : null}
                      {sitting.map((order) => (
                        <OrderCard key={order.id} order={order} soundOn={soundOn} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

