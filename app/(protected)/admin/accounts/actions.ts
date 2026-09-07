'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email/gmail';
import { randomUUID } from 'crypto';

export async function createAccount(formData: FormData) {
  // Re‑verify admin role
  const profile = await requireRole(['ADMIN']);
  if (!profile) throw new Error('Unauthorized');

  const role = (formData.get('role') as string || '').trim().toUpperCase(); // STUDENT, STAFF, ADMIN
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const registerNumber = (formData.get('registerNumber') as string || '').trim().toUpperCase();
  const batchId = (formData.get('batchId') as string || '').trim();
  const phone = (formData.get('phone') as string || '').trim();
  const jobTitle = (formData.get('jobTitle') as string || '').trim();

  // Basic validation
  if (!role || !['STUDENT', 'STAFF', 'ADMIN'].includes(role)) {
    return { success: false, error: 'Invalid role selected' };
  }
  if (!name || !email) {
    return { success: false, error: 'Name and email are required' };
  }
  if (role === 'STUDENT' && (!registerNumber || !batchId)) {
    return { success: false, error: 'Student accounts require register number and batch' };
  }

  const adminSupabase = createAdminClient();

    // Check if an auth user already exists for this email
    // Supabase admin client does not provide a direct getUserByEmail method, so we attempt to create and handle duplicate error.
    // We'll skip explicit check and rely on the createUser error handling.


  // For students, also ensure register number is unique
  if (role === 'STUDENT') {
    const { data: existingStudent } = await adminSupabase
      .from('students')
      .select('id')
      .eq('register_number', registerNumber)
      .maybeSingle();
    if (existingStudent) {
      return { success: false, error: 'Register number already in use' };
    }
  }

  // Generate a random temporary password – never exposed to the admin UI
  const tempPassword = randomUUID();

  let authUserId: string | null = null;
  let domainId: string | null = null; // student_id or staff_id

  try {
    // 1. Create auth user (no email confirmation – they will set password via recovery link)
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
    });
    if (userError) throw userError;
    authUserId = userData.user.id;

    // 2. Insert domain‑specific record
    if (role === 'STUDENT') {
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
      domainId = studentData.id;
    } else {
      // STAFF or ADMIN
      const { data: staffData, error: staffError } = await adminSupabase
        .from('staff')
        .insert({
          name,
          email,
          phone: phone || null,
          role: jobTitle || null,
          department: null,
        })
        .select()
        .single();
      if (staffError) throw staffError;
      domainId = staffData.id;
    }

    // 3. Insert profile linking auth user to role and domain entity
    const profilePayload: any = {
      user_id: authUserId,
      role,
    };
    if (role === 'STUDENT') {
      profilePayload.student_id = domainId;
    } else {
      profilePayload.staff_id = domainId;
    }
    const { error: profileError } = await adminSupabase.from('profiles').insert(profilePayload);
    if (profileError) throw profileError;

    // 4. Generate a recovery link (password‑set) and email it
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
      },
    });
    if (linkError) {
      console.error('[ADMIN][ACCOUNT] Recovery link generation failed:', linkError.message);
    } else {
      await sendVerificationEmail(email, name, linkData.properties.action_link);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[ADMIN][ACCOUNT] Creation error:', err.message);
    // Rollback any partial writes
    if (authUserId) await adminSupabase.auth.admin.deleteUser(authUserId).catch(() => {});
    if (domainId) {
      if (role === 'STUDENT') {
        await adminSupabase.from('students').delete().eq('id', domainId);
      } else {
        await adminSupabase.from('staff').delete().eq('id', domainId);
      }
    }
    return { success: false, error: err.message };
  }
}
