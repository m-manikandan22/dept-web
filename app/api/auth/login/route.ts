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
      const message = error.message.toLowerCase().includes('invalid login credentials')
        ? 'Invalid email or password.'
        : 'Unable to sign you in right now. Please try again.';
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
