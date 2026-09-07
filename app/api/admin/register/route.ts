import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { sendVerificationEmail } from '@/lib/email/gmail';

export async function POST(request: Request) {
  // 1. Authorization check
  // Since this is an API route, we can't use requireRole as a server component.
  // We need to check the session and profile manually.
  const adminSupabase = createAdminClient();
  const { data: { user }, error: authError } = await adminSupabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), { status: 403 });
  }

  const formData = await request.formData();
  const registerNumber = (formData.get('registerNumber') as string || '').trim().toUpperCase();
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;
  const batchId = formData.get('batchId') as string;

  if (!registerNumber || !name || !email || !password || !batchId) {
    return new Response(JSON.stringify({ error: 'All fields are required' }), { status: 400 });
  }

  let authUserId: string | null = null;
  let studentId: string | null = null;

  try {
    // 2. Create Auth User
    // We use admin.createUser to create the user without requiring email confirmation immediately,
    // or we can use generateLink for a "welcome" flow.
    // For this architecture, we'll create the user and send a password setup link.
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (userError) throw userError;
    authUserId = userData.user.id;

    // 3. Create Student Record
    const { data: studentData, error: studentError } = await adminSupabase
      .from('students')
      .insert({
        register_number: registerNumber,
        name,
        email,
        batch_id: batchId,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (studentError) throw studentError;
    studentId = studentData.id;

    // 4. Create Profile
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        user_id: authUserId,
        student_id: studentId,
        role: 'STUDENT',
      });

    if (profileError) throw profileError;

    // 5. Send Welcome Email
    // We can generate a password reset link or a signup link for them to set their own password
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    });

    if (linkError) {
      console.error('[ADMIN-REGISTER] Link generation failed:', linkError.message);
      // We don't throw here because the user is already created
    } else {
      await sendVerificationEmail(email, name, linkData.properties.action_link);
    }

    return new Response(JSON.stringify({ success: true, studentId }), { status: 201 });
  } catch (error: any) {
    console.error('[ADMIN-REGISTER] Error:', error.message);

    // Rollback
    if (authUserId) await adminSupabase.auth.admin.deleteUser(authUserId);
    if (studentId) await adminSupabase.from('students').delete().eq('id', studentId);

    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
