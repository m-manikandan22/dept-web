import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = (formData.get('email') as string || '').trim().toLowerCase();

  if (!email) {
    return redirect('/forgot-password?status=error&message=Email is required.');
  }

  const supabase = await createClient();

  try {
    console.log(`[AUTH][FORGOT-PASSWORD] Requesting reset for: ${email}`);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      console.warn(`[AUTH][FORGOT-PASSWORD] Reset request failed for ${email}: ${error.message}`);
      return redirect('/forgot-password?status=error&message=Unable to process your request. Please try again.');
    }

    console.log(`[AUTH][FORGOT-PASSWORD] Reset link sent to: ${email}`);
    return redirect('/forgot-password?status=success&message=If an account exists for this email, a password reset link has been sent.');
  } catch (error: any) {
    console.error('[AUTH][FORGOT-PASSWORD] Unexpected error:', error);
    return redirect('/forgot-password?status=error&message=An unexpected error occurred. Please try again.');
  }
}
