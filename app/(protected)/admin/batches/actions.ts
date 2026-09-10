'use server';

import { batchRepository } from '@/lib/repositories/batchRepository';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVerificationEmail } from '@/lib/email/gmail';

export async function createBatch(formData: FormData) {
  // Re‑verify admin role on each request
  const profile = await requireRole(['ADMIN']);
  if (!profile) throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  if (!name) throw new Error('Batch name is required');

  try {
    await batchRepository.create(name);
    revalidatePath('/admin/batches');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteBatch(formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) throw new Error('Batch ID is required');

  // Re‑verify admin role on each request
  const profile = await requireRole(['ADMIN']);
  if (!profile) throw new Error('Unauthorized');

  try {
    const adminSupabase = createAdminClient();

    // Pre-check: Count students assigned to this batch
    const { count, error: countError } = await adminSupabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', id);

    if (countError) throw countError;
    if (count && count > 0) {
      throw new Error(`Cannot delete: ${count} students are still assigned to this batch. Reassign or remove them first.`);
    }

    await batchRepository.delete(id);
    revalidatePath('/admin/batches');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function registerStudentInBatch(formData: FormData) {
  const profile = await requireRole(['ADMIN']);
  if (!profile) throw new Error('Unauthorized');

  const registerNumber = (formData.get('registerNumber') as string || '').trim().toUpperCase();
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = formData.get('password') as string;
  const batchId = formData.get('batchId') as string;

  if (!registerNumber || !name || !email || !password || !batchId) {
    throw new Error('All fields are required');
  }

  const adminSupabase = createAdminClient();
  let authUserId: string | null = null;
  let studentId: string | null = null;

  try {
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email, password, email_confirm: false,
    });
    if (userError) throw userError;
    authUserId = userData.user.id;

    const { data: studentData, error: studentError } = await adminSupabase
      .from('students')
      .insert({ register_number: registerNumber, name, email, batch_id: batchId, status: 'ACTIVE' })
      .select()
      .single();
    if (studentError) throw studentError;
    studentId = studentData.id;

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .insert({ user_id: authUserId, student_id: studentId, role: 'STUDENT' });
    if (profileError) throw profileError;

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'signup', email, password,
    });
    if (!linkError) {
      await sendVerificationEmail(email, name, linkData.properties.action_link);
    } else {
      console.error('[REGISTER] Link generation failed:', linkError.message);
    }

    revalidatePath(`/admin/batches/${batchId}/users`);
    return { success: true, studentId };
  } catch (error: any) {
    if (authUserId) await adminSupabase.auth.admin.deleteUser(authUserId);
    if (studentId) await adminSupabase.from('students').delete().eq('id', studentId);
    return { success: false, error: error.message };
  }
}
