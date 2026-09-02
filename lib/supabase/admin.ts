import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client
 * Strictly server-only.
 * Uses Service Role Key to bypass RLS.
 * MUST NEVER be exported to the browser.
 */
export const createAdminClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
