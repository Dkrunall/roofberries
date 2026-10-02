'use client';

import { useState, useTransition } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { signIn } from '@/lib/actions/auth';
import { WarningIcon } from '@/components/icons';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await signIn(email, password);
      } catch (err) {
        unstable_rethrow(err);
        setError(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#5c4e44]">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-[#e5dbd0] bg-[#f5efe7] px-4 py-3 text-sm text-[#352c29] placeholder-zinc-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#5c4e44]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-[#e5dbd0] bg-[#f5efe7] px-4 py-3 text-sm text-[#352c29] placeholder-zinc-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
        />
      </div>

      {error ? (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          <WarningIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="gold-gradient-btn w-full rounded-xl py-3.5 text-center text-sm font-bold shadow-lg disabled:opacity-60 transition-all cursor-pointer"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            Authenticating...
          </span>
        ) : (
          'Sign In to Dashboard'
        )}
      </button>
    </form>
  );
}

