import { createClient } from '@/lib/supabase/server';

export interface OrderFeedbackView {
  rating: number;
  comment: string | null;
}

/** Used by the status screen to decide whether to show the rating prompt
 *  or a "thanks, already rated" state — e.g. after a page refresh. */
export async function getFeedbackForOrder(orderId: string): Promise<OrderFeedbackView | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('order_feedback')
    .select('rating, comment')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return { rating: data.rating, comment: data.comment };
}
