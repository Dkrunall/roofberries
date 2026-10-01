'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRefetchOnFocus } from '@/lib/useRefetchOnFocus';
import type { Database } from '@/types/database';
import { BRAND } from '@/lib/brand';

export interface CartLine {
  id: string;
  guestId: string;
  guestName: string;
  menuItemId: string;
  menuItemName: string;
  categoryName: string;
  variantId: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  notes: string;
  imageUrl: string | null;
}

interface CartContextValue {
  lines: CartLine[];
  /** Resolves `true` once the line has actually joined the cart, `false`
   *  if it gave up (e.g. the cart never finished loading) — callers should
   *  only show a success confirmation once this resolves `true`. */
  addLine: (input: Omit<CartLine, 'id' | 'quantity' | 'guestId' | 'guestName'> & { quantity: number }) => Promise<boolean>;
  updateQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  /** This device's identity within the table's shared cart. */
  guestId: string;
  guestName: string;
  setGuestName: (name: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

type CartItemRow = Database['public']['Tables']['cart_items']['Row'];

function rowToLine(row: CartItemRow): CartLine {
  return {
    id: row.id,
    guestId: row.guest_id,
    guestName: row.guest_name,
    menuItemId: row.menu_item_id,
    menuItemName: row.menu_item_name,
    categoryName: row.category_name,
    variantId: row.variant_id,
    variantLabel: row.variant_label,
    unitPrice: Number(row.unit_price),
    quantity: row.quantity,
    notes: row.notes,
    imageUrl: row.image_url,
  };
}

function guestIdKey(tableNumber: number) {
  return `${BRAND.slug}-guest-id-table-${tableNumber}`;
}

function guestNameKey(tableNumber: number) {
  return `${BRAND.slug}-guest-name-table-${tableNumber}`;
}

/** Reads this device's guest identity for the table, minting one on first
 *  visit — a stable random id plus a friendly default name ("Guest 42") so
 *  lines this device adds are attributed distinctly from other guests at
 *  the same table without requiring anyone to sign in or type anything. */
function loadOrCreateGuestIdentity(tableNumber: number): { guestId: string; guestName: string } {
  let guestId = window.localStorage.getItem(guestIdKey(tableNumber));
  if (!guestId) {
    guestId = crypto.randomUUID();
    window.localStorage.setItem(guestIdKey(tableNumber), guestId);
  }
  let guestName = window.localStorage.getItem(guestNameKey(tableNumber));
  if (!guestName) {
    guestName = `Guest ${Math.floor(10 + Math.random() * 90)}`;
    window.localStorage.setItem(guestNameKey(tableNumber), guestName);
  }
  return { guestId, guestName };
}

/**
 * Shared, realtime-synced cart for one dining table — every phone that
 * scanned the same table's QR reads and writes the same `cart_items` rows,
 * so a group can build one order together and watch it update live as each
 * person adds their own dish. Mutations are applied optimistically to local
 * state and mirrored to Supabase; the realtime subscription reconciles
 * whatever any device (including this one) actually persisted, so a slow
 * network never leaves two phones looking at different carts for long.
 */
export function CartProvider({
  tableNumber,
  children,
}: {
  tableNumber: number;
  children: React.ReactNode;
}) {
  const [identity, setIdentity] = useState<{ guestId: string; guestName: string } | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const tableIdRef = useRef<string | null>(null);

  // Resolve this device's guest identity once on mount (localStorage isn't
  // available during SSR, so this can't be a lazy useState initializer).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external store (localStorage) on mount, not a derived-state cascade
    setIdentity(loadOrCreateGuestIdentity(tableNumber));
  }, [tableNumber]);

  // Resolve table_number -> table_id, then load the current shared cart and
  // subscribe to live changes from every other device at this table.
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

      tableIdRef.current = table.id;

      const { data: rows } = await supabase
        .from('cart_items')
        .select('*')
        .eq('table_id', table.id)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      setLines((rows ?? []).map(rowToLine));

      channel = supabase
        .channel(`table-cart-${table.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cart_items', filter: `table_id=eq.${table.id}` },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id: string }).id;
              setLines((prev) => prev.filter((l) => l.id !== deletedId));
              return;
            }
            const line = rowToLine(payload.new as CartItemRow);
            setLines((prev) => {
              const idx = prev.findIndex((l) => l.id === line.id);
              if (idx === -1) return [...prev, line];
              const next = [...prev];
              next[idx] = line;
              return next;
            });
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

  // Belt-and-suspenders for the realtime subscription above: mobile
  // browsers suspend a backgrounded tab's websocket, and Realtime doesn't
  // replay events missed while it was down. A guest who adds something,
  // locks their phone, then comes back could otherwise be looking at a
  // cart that's missing whatever another guest at the table added in the
  // meantime — this forces a resync the moment the page is looked at again.
  const refetchCart = useCallback(async () => {
    if (!tableIdRef.current) return;
    const supabase = createClient();
    try {
      const { data: rows, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('table_id', tableIdRef.current)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setLines((rows ?? []).map(rowToLine));
    } catch (err) {
      console.error('Failed to refresh cart:', err);
    }
  }, []);
  useRefetchOnFocus(refetchCart);

  const addLine = useCallback(
    (input: Omit<CartLine, 'id' | 'quantity' | 'guestId' | 'guestName'> & { quantity: number }): Promise<boolean> => {
      if (!identity) return Promise.resolve(false);
      const currentIdentity = identity;

      function performInsert() {
        const supabase = createClient();
        const existing = lines.find(
          (l) =>
            l.guestId === currentIdentity.guestId &&
            l.menuItemId === input.menuItemId &&
            l.variantId === input.variantId &&
            l.notes === input.notes
        );

        if (existing) {
          const nextQuantity = existing.quantity + input.quantity;
          setLines((prev) => prev.map((l) => (l.id === existing.id ? { ...l, quantity: nextQuantity } : l)));
          supabase.from('cart_items').update({ quantity: nextQuantity, updated_at: new Date().toISOString() }).eq('id', existing.id).then();
          return;
        }

        const id = crypto.randomUUID();
        const newLine: CartLine = { ...input, id, guestId: currentIdentity.guestId, guestName: currentIdentity.guestName };
        setLines((prev) => [...prev, newLine]);
        supabase
          .from('cart_items')
          .insert({
            id,
            table_id: tableIdRef.current!,
            guest_id: currentIdentity.guestId,
            guest_name: currentIdentity.guestName,
            menu_item_id: input.menuItemId,
            menu_item_name: input.menuItemName,
            category_name: input.categoryName,
            variant_id: input.variantId,
            variant_label: input.variantLabel,
            unit_price: input.unitPrice,
            quantity: input.quantity,
            notes: input.notes,
            image_url: input.imageUrl,
          })
          .then();
      }

      if (tableIdRef.current) {
        performInsert();
        return Promise.resolve(true);
      }

      // The table/cart lookup (see init() below) hasn't resolved yet —
      // e.g. a customer tapping "+ Add" within the first instant the menu
      // opens, before we know which table this is. This used to just
      // silently drop the tap: the item's "Added" confirmation still
      // played, but nothing actually joined the cart. Retry briefly
      // instead; init() finishes almost always within a couple hundred ms.
      return new Promise<boolean>((resolve) => {
        let attempts = 0;
        const retry = setInterval(() => {
          attempts += 1;
          if (tableIdRef.current) {
            clearInterval(retry);
            performInsert();
            resolve(true);
          } else if (attempts >= 20) {
            clearInterval(retry);
            resolve(false);
          }
        }, 150);
      });
    },
    [identity, lines]
  );

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const supabase = createClient();
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.id !== id));
      supabase.from('cart_items').delete().eq('id', id).then();
      return;
    }
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, quantity } : l)));
    supabase.from('cart_items').update({ quantity, updated_at: new Date().toISOString() }).eq('id', id).then();
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    createClient().from('cart_items').delete().eq('id', id).then();
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
    if (tableIdRef.current) {
      createClient().from('cart_items').delete().eq('table_id', tableIdRef.current).then();
    }
  }, []);

  const setGuestName = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 40);
      if (!trimmed || !identity) return;
      window.localStorage.setItem(guestNameKey(tableNumber), trimmed);
      setIdentity((prev) => (prev ? { ...prev, guestName: trimmed } : prev));
      setLines((prev) => prev.map((l) => (l.guestId === identity.guestId ? { ...l, guestName: trimmed } : l)));
      if (tableIdRef.current) {
        createClient()
          .from('cart_items')
          .update({ guest_name: trimmed })
          .eq('table_id', tableIdRef.current)
          .eq('guest_id', identity.guestId)
          .then();
      }
    },
    [identity, tableNumber]
  );

  const totalItems = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);
  const totalPrice = useMemo(() => lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0), [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      addLine,
      updateQuantity,
      removeLine,
      clearCart,
      totalItems,
      totalPrice,
      guestId: identity?.guestId ?? '',
      guestName: identity?.guestName ?? 'Guest',
      setGuestName,
    }),
    [lines, addLine, updateQuantity, removeLine, clearCart, totalItems, totalPrice, identity, setGuestName]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
