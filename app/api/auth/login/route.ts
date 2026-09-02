import { createClient } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  const formData = await request.formData();
  const registerNumber = formData.get('registerNumber') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  // Lookup email by register number
  const { data: student, error: lookupError } = await supabase
    .from('students')
    .select('email')
    .eq('register_number', registerNumber)
    .single();

  if (lookupError || !student) {
    return redirect(`/login?message=${encodeURIComponent('Invalid register number or account not found')}`);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: student.email,
    password,
  });

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`);
  }

  // The profile role should already be set in the DB
  return redirect('/dashboard');
}
