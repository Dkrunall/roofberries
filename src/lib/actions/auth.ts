'use server';

import { redirect, unstable_rethrow } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/actions/errors';

const GENERIC_FAILURE_MESSAGE = 'Something went wrong signing in. Please try again.';

export async function signIn(email: string, password: string) {
  try {
    await signInUnsafe(email, password);
  } catch (err) {
    unstable_rethrow(err); // let redirect() on success propagate untouched
    if (err instanceof ActionError) throw err;
    console.error('signIn failed:', err);
    throw new ActionError(GENERIC_FAILURE_MESSAGE);
  }
}

async function signInUnsafe(email: string, password: string) {
  if (!email || !password) throw new ActionError('Enter your email and password.');

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new ActionError('Incorrect email or password.');

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    throw new ActionError('This account is not set up as an admin.');
  }

  redirect('/admin/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
