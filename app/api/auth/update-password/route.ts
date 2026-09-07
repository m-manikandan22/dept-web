import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return redirect('/reset-password?status=error&message=Password is required.');
  }

  if (password !== confirmPassword) {
    return redirect('/reset-password?status=error&message=Passwords do not match.');
  }

  // Password Policy check (reuse logic if possible, but for now hardcoded)
  const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!PASSWORD_POLICY.test(password)) {
    return redirect('/reset-password?status=error&message=Password must be at least 8 characters and include an uppercase letter, lowercase letter, and number.');
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.warn(`[AUTH][UPDATE-PASSWORD] Update failed: ${error.message}`);
      return redirect('/reset-password?status=error&message=Unable to update password. Please try again.');
    }

    return redirect('/login?status=success&message=Password updated successfully. You can now log in.');
  } catch (error: any) {
    console.error('[AUTH][UPDATE-PASSWORD] Unexpected error:', error);
    return redirect('/reset-password?status=error&message=An unexpected error occurred. Please try again.');
  }
}
