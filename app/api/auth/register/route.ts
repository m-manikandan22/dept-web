import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  const formData = await request.formData();
  const registerNumber = (formData.get('registerNumber') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!registerNumber || !email || !password) {
    return redirect('/register?message=All fields are required');
  }

  try {
    // 1. Verify student exists in the master database and get their authorized email
    // We use .ilike for case-insensitive matching of the register number
    console.log(`[REGISTRATION] Attempting lookup for register number: "${registerNumber}"`);
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, email')
      .ilike('register_number', registerNumber)
      .single();

    if (studentError) {
      console.error('[REGISTRATION] Student lookup failed:', {
        message: studentError.message,
        code: studentError.code,
        details: studentError.details,
        hint: studentError.hint,
      });

      if (studentError.code === 'PGRST116') {
        console.log('[REGISTRATION] Student not found (PGRST116)');
        return redirect('/register?message=Register number not found in our database.');
      }
      return redirect('/register?message=Unable to verify your student record right now. Please try again.');
    }

    if (!student) {
      console.log('[REGISTRATION] Student not found (null data)');
      return redirect('/register?message=Register number not found in our database.');
    }

    console.log('[REGISTRATION] Student found successfully');

    // 2. Verify the provided email matches the master record
    const authorizedEmail = student.email?.trim().toLowerCase();
    if (!authorizedEmail || email !== authorizedEmail) {
      console.log('[REGISTRATION] Email mismatch');
      return redirect('/register?message=Register number and college email do not match.');
    }

    // 3. Check if a profile already exists for this student (duplicate account)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', student.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[AUTH] Database error checking existing profile:', profileError);
      return redirect('/register?message=Unable to verify account status right now. Please try again.');
    }

    if (profile) {
      console.log('[REGISTRATION] Account already exists');
      return redirect('/login?message=An account already exists. Please log in.');
    }

    // 4. Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return redirect('/register?message=Authentication account creation failed: ' + authError.message);
    }

    // 5. Create the profile linked to this auth user and student record
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        role: 'STUDENT',
        student_id: student.id,
      });

    if (profileInsertError) {
      // Rollback auth user if profile creation fails to prevent inconsistent state
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return redirect('/register?message=Profile creation failed. Your account was not created.');
    }

    // 6. Sign in the new user server-side to create a session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return redirect('/login?message=Registration successful, but automatic login failed. Please log in manually.');
    }

    return redirect('/dashboard');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[AUTH] Registration error:', error);
    return redirect('/register?message=An unexpected error occurred. Please try again.');
  }
}
