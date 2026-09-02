import { createClient } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return redirect('/login?message=Email and password are required');
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide a clear but secure error message
    const message = error.message.toLowerCase().includes('invalid login credentials')
      ? 'Invalid email or password'
      : error.message;
    return redirect(`/login?message=${encodeURIComponent(message)}`);
  }

  return redirect('/dashboard');
}
