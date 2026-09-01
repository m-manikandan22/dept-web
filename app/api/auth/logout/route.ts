import { createClient } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/login');
}
