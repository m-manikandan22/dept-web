import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  const formData = await request.formData();
  const registerNumber = formData.get('registerNumber') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!registerNumber || !email || !password) {
    return redirect('/register?message=Missing fields');
  }

  try {
    // 1. Check if the student exists in the students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('register_number', registerNumber)
      .single();

    if (studentError || !student) {
      return redirect('/register?message=Register number not found in our database. Please contact administration.');
    }

    // 2. Check if a profile already exists for this student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', student.id)
      .single();

    if (profile || !profileError) {
      return redirect('/login?message=Account already registered. Please login.');
    }

    // 3. Create the user in Supabase Auth
    // Note: We use the service_role key to create users administratively
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return redirect('/register?message=Registration failed: ' + authError.message);
    }

    // 4. Create the profile linked to this auth user and student record
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        role: 'STUDENT',
        student_id: student.id,
      });

    if (profileInsertError) {
      // Rollback auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return redirect('/register?message=Profile creation failed: ' + profileInsertError.message);
    }

    return redirect('/dashboard');
  } catch (error: any) {
    return redirect('/register?message=Unexpected error: ' + error.message);
  }
}
