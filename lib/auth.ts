import { createClient as createSsrClient } from '@/lib/supabase/server';

export async function createClient() {
  return await createSsrClient();
}

export async function getCurrentUser() {
  const supabase = await createSsrClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile() {
  const supabase = await createSsrClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    console.error('[AUTH] Error fetching user profile:', profileError);
    return null;
  }

  return profile;
}

export async function getUserRole() {
  const profile = await getCurrentProfile();
  return profile?.role || null;
}
