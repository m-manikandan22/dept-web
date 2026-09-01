import { createClient } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { nextjsI18nPages } from '@vercel/internationalization/client';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  // The profile role should already be set in the DB
  return redirect('/dashboard');
}
