import { createAdminClient } from '@/lib/supabase/admin';

async function diagnoseUser(email: string) {
  const adminSupabase = createAdminClient();
  console.log(`\n--- Diagnosing User: ${email} ---`);

  // 1. Check Auth User
  const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers();
  const user = authUsers?.users.find(u => u.email === email);

  if (!user) {
    console.error('❌ Auth user not found');
    return;
  }
  console.log('✅ Auth User Found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email Confirmed: ${!!user.email_confirmed_at}`);

  // 2. Check Student Record
  const { data: student, error: studentError } = await adminSupabase
    .from('students')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (studentError) {
    console.error('❌ Error querying students table:', studentError.message);
  } else if (!student) {
    console.error('❌ Student record not found for this email');
  } else {
    console.log('✅ Student Record Found:');
    console.log(`   ID: ${student.id}`);
    console.log(`   Reg No: ${student.register_number}`);
  }

  // 3. Check Profile Record
  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Error querying profiles table:', profileError.message);
  } else if (!profile) {
    console.error('❌ Profile record NOT FOUND for this user_id');
  } else {
    console.log('✅ Profile Record Found:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   User ID: ${profile.user_id} (Match: ${profile.user_id === user.id})`);
    console.log(`   Student ID: ${profile.student_id}`);
    console.log(`   Role: ${profile.role}`);
  }

  if (student && profile) {
    console.log(`Linkage check: Profile student_id (${profile.student_id}) === Student id (${student.id})? ${profile.student_id === student.id}`);
  }
}

diagnoseUser('mmanikandan0005@gmail.com').catch(console.error);
