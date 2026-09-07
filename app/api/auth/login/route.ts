import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return redirect('/login?message=Email and password are required.');
  }

  const supabase = await createClient();

  try {
    console.log(`[AUTH][LOGIN] Attempting sign-in for: ${email}`);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn(`[AUTH][LOGIN] Sign-in failed for ${email}: ${error.message}`);

      let message = 'Unable to sign you in right now. Please try again.';
      const errMsg = error.message.toLowerCase();

      if (errMsg.includes('invalid login credentials')) {
        message = 'Invalid email or password.';
      } else if (errMsg.includes('email not confirmed') || errMsg.includes('confirm your email')) {
        message = 'Please verify your email before logging in.';
      }

      return redirect(`/login?message=${encodeURIComponent(message)}`);
    }

    console.log(`[AUTH][LOGIN] Sign-in successful for: ${email}`);
    return redirect('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[AUTH][LOGIN] Unexpected error:', error);
    return redirect('/login?message=Unable to sign you in right now. Please try again.');
  }
}
