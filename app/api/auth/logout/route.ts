import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function POST() {
  try {
    const supabase = await createClient();

    console.log('[AUTH][LOGOUT] Attempting sign-out');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[AUTH][LOGOUT] Sign-out error:', error.message);
      // We still redirect to login even if signOut fails to clear local state
    }

    console.log('[AUTH][LOGOUT] Sign-out successful');
    return redirect('/login');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[AUTH][LOGOUT] Unexpected error:', error);
    return redirect('/login');
  }
}
