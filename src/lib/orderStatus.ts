import type { OrderStatus } from '@/types/database';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  placed: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: null,
};
