'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createServiceRequest } from '@/lib/actions/serviceRequests';
import { CheckIcon, ConciergeBellIcon, DocumentIcon, WarningIcon } from '@/components/icons';
import type { Database, ServiceRequestType } from '@/types/database';

type ServiceRequestRow = Database['public']['Tables']['service_requests']['Row'];

const LABEL: Record<ServiceRequestType, { idle: string; pending: string; icon: typeof ConciergeBellIcon }> = {
  call_waiter: { idle: 'Call Waiter', pending: 'Waiter Notified', icon: ConciergeBellIcon },
  request_bill: { idle: 'Request Bill', pending: 'Bill Requested', icon: DocumentIcon },
};

/**
 * Table-shared, realtime-synced "Call Waiter" / "Request Bill" buttons —
 * same pattern as the shared cart: any guest's device at the table sees
 * the pending state the instant anyone (including staff, via Acknowledge)
 * changes it, so nobody double-taps a request that's already in flight.
 */
export function ServiceRequestButtons({ tableNumber }: { tableNumber: number }) {
  const [pending, setPending] = useState<Record<ServiceRequestType, boolean>>({
    call_waiter: false,
    request_bill: false,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data: table } = await supabase
        .from('tables')
        .select('id')
        .eq('table_number', tableNumber)
        .eq('is_active', true)
        .maybeSingle();
      if (cancelled || !table) return;

      const { data: rows } = await supabase
        .from('service_requests')
        .select('type')
        .eq('table_id', table.id)
        .eq('status', 'pending');
      if (cancelled) return;
      const rowTypes = new Set((rows ?? []).map((r) => r.type));
      setPending({ call_waiter: rowTypes.has('call_waiter'), request_bill: rowTypes.has('request_bill') });

      channel = supabase
        .channel(`service-requests-${table.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'service_requests', filter: `table_id=eq.${table.id}` },
          (payload) => {
            const row = (payload.new ?? payload.old) as ServiceRequestRow | undefined;
            if (!row) return;
            setPending((prev) => ({
              ...prev,
              [row.type]: payload.eventType !== 'DELETE' && (payload.new as ServiceRequestRow)?.status === 'pending',
            }));
          }
        )
        .subscribe();
    }

    init();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [tableNumber]);

  async function handleRequest(type: ServiceRequestType) {
    if (pending[type]) return;
    setError(null);
    setPending((prev) => ({ ...prev, [type]: true }));
    try {
      await createServiceRequest(tableNumber, type);
    } catch {
      setPending((prev) => ({ ...prev, [type]: false }));
      setError('Could not reach the kitchen. Please ask a staff member directly.');
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {(Object.keys(LABEL) as ServiceRequestType[]).map((type) => {
          const { idle, pending: pendingLabel, icon: Icon } = LABEL[type];
          const isPending = pending[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleRequest(type)}
              disabled={isPending}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${isPending
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 cursor-default'
                  : 'border-white/10 bg-zinc-900/80 text-zinc-200 hover:border-amber-400/40 hover:bg-zinc-800 active:scale-95 shadow-sm'
                }`}
            >
              {isPending ? <CheckIcon className="h-4 w-4 text-emerald-400" /> : <Icon className="h-4 w-4 text-amber-400" />}
              <span className="truncate">{isPending ? pendingLabel : idle}</span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
          <WarningIcon className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
