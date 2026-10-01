// Supabase client for use in Server Components, Route Handlers, and
// Server Actions. Reads/writes the admin auth session via Next.js cookies.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll is called from a Server Component during render, where
            // cookies can't be mutated. Safe to ignore as long as
            // middleware.ts is also refreshing the session (see below).
          }
        },
      },
    }
  );
}
