'use server';

import { unstable_rethrow } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/actions/errors';

const GENERIC_FAILURE_MESSAGE = 'Something went wrong submitting your rating. Please try again.';

/**
 * Records a 1-5 star rating (+ optional comment) for an order. Only allowed
 * once the order is "served" (enforced both here and by the order_feedback
 * RLS insert policy) and only once per order — a repeat submission for the
 * same order id is rejected by the table's unique constraint on order_id.
 */
export async function submitOrderFeedback(orderId: string, rating: number, comment: string) {
  try {
    await submitOrderFeedbackUnsafe(orderId, rating, comment);
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof ActionError) throw err;
    console.error('submitOrderFeedback failed:', err);
    throw new ActionError(GENERIC_FAILURE_MESSAGE);
  }
}

async function submitOrderFeedbackUnsafe(orderId: string, rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ActionError('Please choose a rating between 1 and 5 stars.');
  }

  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) throw new ActionError('We couldn’t find that order.');
  if (order.status !== 'served') {
    throw new ActionError('Ratings can only be submitted once your order has been served.');
  }

  const trimmedComment = comment.trim().slice(0, 500);

  const { error: insertError } = await supabase.from('order_feedback').insert({
    order_id: orderId,
    rating,
    comment: trimmedComment || null,
  });
  if (insertError) {
    if (insertError.code === '23505') {
      throw new ActionError('You’ve already rated this order — thank you!');
    }
    throw insertError;
  }
}
