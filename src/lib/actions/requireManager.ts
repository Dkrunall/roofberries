// Kept out of any 'use server' module for the same reason as errors.ts —
// Next.js only allows async function exports from Server Action files.
import { redirect } from 'next/navigation';
import { getCurrentAdmin, type CurrentAdmin } from '@/lib/data/admin';
import { ActionError } from '@/lib/actions/errors';

/**
 * For Server Actions restricted to the 'manager' role (menu/table
 * management — everything the 'kitchen' role shouldn't touch). RLS's
 * `is_admin()` only checks admin_users membership, not role, so without
 * this, a signed-in 'kitchen' admin (or anyone scripting a request with
 * that session) could call these actions directly — the nav UI hiding
 * their links from kitchen accounts isn't an access control.
 */
export async function requireManager(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new ActionError('You must be signed in as an admin.');
  if (admin.role !== 'manager') throw new ActionError('Only managers can do this.');
  return admin;
}

/**
 * Same check for manager-only Server Component pages (menu, tables, order
 * history) — stops a 'kitchen' admin from reaching them by typing the URL
 * directly, since the layout's nav only *hides* those links for them.
 */
export async function requireManagerOrRedirect(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  if (admin.role !== 'manager') redirect('/admin/dashboard');
  return admin;
}
