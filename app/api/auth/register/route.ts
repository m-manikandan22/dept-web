import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function POST(request: Request) {
  const formData = await request.formData();
  const registerNumber = (formData.get('registerNumber') as string || '').trim().toUpperCase();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;

  // 1. Validate input
  if (!registerNumber || !email || !password) {
    return redirect('/register?message=All fields are required.');
  }

  if (password.length < 6) {
    return redirect('/register?message=Password must be at least 6 characters long.');
  }

  const adminSupabase = createAdminClient();
  const ssrSupabase = await createClient();

  try {
    // 2. Find master student record
    console.log(`[AUTH][REGISTER] Looking up student: ${registerNumber}`);
    const { data: student, error: studentError } = await adminSupabase
      .from('students')
      .select('id, email, status')
      .eq('register_number', registerNumber)
      .maybeSingle();

    if (studentError) {
      console.error(`[AUTH][REGISTER] Database error during lookup for ${registerNumber}:`, studentError);
      return redirect('/register?message=Unable to verify your student record right now. Please try again.');
    }

    if (!student) {
      console.warn(`[AUTH][REGISTER] Student not found: ${registerNumber}`);
      return redirect('/register?message=Register number not found in our student database.');
    }

    // 3. Verify student status
    if (student.status !== 'ACTIVE') {
      console.warn(`[AUTH][REGISTER] Inactive student: ${registerNumber}`);
      return redirect('/register?message=This student account is not eligible for registration.');
    }

    // 4. Verify college email
    const authorizedEmail = student.email?.trim().toLowerCase();
    if (!authorizedEmail || email !== authorizedEmail) {
      console.warn(`[AUTH][REGISTER] Email mismatch for ${registerNumber}`);
      return redirect('/register?message=Register number and college email do not match.');
    }

    // 5. Check for existing profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('student_id', student.id)
      .single();

    if (profile) {
      console.warn(`[AUTH][REGISTER] Profile already exists for student: ${student.id}`);
      return redirect('/login?message=An account already exists for this student. Please log in.');
    }

    // 6. Create Auth User (Admin API)
    console.log(`[AUTH][REGISTER] Creating auth user for: ${email}`);
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('[AUTH][REGISTER] Auth user creation failed:', authError.message);
      // Handle duplicate email explicitly if it's not already handled by the profile check
      if (authError.message.includes('already registered')) {
        return redirect('/login?message=An account already exists. Please log in.');
      }
      return redirect('/register?message=Unable to create your account right now. Please try again.');
    }

    // 7. Create Profile
    console.log(`[AUTH][REGISTER] Creating profile for user: ${authUser.user.id}`);
    const { error: profileInsertError } = await adminSupabase
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        role: 'STUDENT',
        student_id: student.id,
      });

    if (profileInsertError) {
      console.error('[AUTH][REGISTER] Profile creation failed, rolling back auth user:', profileInsertError.message);
      // Rollback Auth user to prevent orphaned accounts
      await adminSupabase.auth.admin.deleteUser(authUser.user.id);
      return redirect('/register?message=Unable to create your account right now. Please try again.');
    }

    // 8. Establish SSR Session
    // We use the SSR client's signInWithPassword to set the cookies for the browser
    console.log(`[AUTH][REGISTER] Establishing session for: ${email}`);
    const { error: signInError } = await ssrSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[AUTH][REGISTER] Auto-login failed:', signInError.message);
      return redirect('/login?message=Registration successful, but automatic login failed. Please log in manually.');
    }

    console.log(`[AUTH][REGISTER] Registration successful for: ${email}`);
    return redirect('/dashboard');

  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[AUTH][REGISTER] Unexpected error:', error);
    return redirect('/register?message=An unexpected error occurred. Please try again.');
  }
}
