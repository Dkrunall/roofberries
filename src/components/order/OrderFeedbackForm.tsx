'use client';

import { useState, useTransition } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { submitOrderFeedback } from '@/lib/actions/feedback';
import { CheckIcon, StarIcon, WarningIcon } from '@/components/icons';
import { BRAND } from '@/lib/brand';

const RATING_LABELS: Record<number, string> = {
  1: 'Not great',
  2: 'Could be better',
  3: 'Good',
  4: 'Great',
  5: 'Excellent!',
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;

  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          aria-pressed={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          className="p-1 transition-transform hover:scale-110 active:scale-95"
        >
          <StarIcon filled={n <= shown} className={`h-8 w-8 ${n <= shown ? 'text-[#85233e]' : 'text-amber-900/40'}`} />
        </button>
      ))}
    </div>
  );
}

export function OrderFeedbackForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-emerald-500/30 bg-emerald-50 p-6 text-center shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-800">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-emerald-800">Thanks for the feedback!</p>
        <p className="text-xs text-[#78675c]">It helps us make Roofberries even better.</p>
      </div>
    );
  }

  function handleSubmit() {
    if (rating === 0) {
      setError('Please tap a star to rate your experience.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submitOrderFeedback(orderId, rating, comment);
        setSubmitted(true);
      } catch (err) {
        unstable_rethrow(err);
        setError(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.');
      }
    });
  }

  return (
    <div className="space-y-4 rounded-3xl border border-[#e5d9cc] bg-white p-5 shadow-sm">
      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold text-[#30251f]">How was your experience?</h3>
        <p className="text-xs text-[#78675c]">Rate your order at {BRAND.name}</p>
      </div>

      <StarPicker value={rating} onChange={setRating} />
      {rating > 0 ? (
        <p className="text-center text-xs font-bold text-[#85233e]">{RATING_LABELS[rating]}</p>
      ) : null}

      <textarea
        aria-label="Feedback (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Anything you'd like to tell us? (optional)"
        rows={2}
        maxLength={500}
        className="w-full resize-none rounded-2xl border border-[#e5d9cc] bg-[#f5efe6] px-4 py-2.5 text-xs text-[#30251f] placeholder:text-[#78675c] outline-none focus:border-[#e5d9cc] focus:ring-1 focus:ring-amber-400 transition-all"
      />

      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          <WarningIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full rounded-2xl bg-[#85233e] hover:bg-[#6c1c32] py-3 text-center text-xs font-semibold text-white shadow-sm hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all"
      >
        {isPending ? 'Submitting…' : 'Submit Rating'}
      </button>
    </div>
  );
}
