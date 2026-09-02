import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Client
 * Used in client components.
 * Uses only Public URL and Anon Key.
 */
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
