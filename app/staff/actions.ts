'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/auth';
import { staffService } from '@/lib/services/staffService';
import { studentService } from '@/lib/services/studentService';

export async function verifyAchievement(formData: FormData) {
  const achievementId = formData.get('achievementId') as string;
  const status = formData.get('status') as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  await staffService.verifyAchievement(achievementId, status, user.id);
  revalidatePath('/staff/verify');
}

export async function verifyCertification(formData: FormData) {
  const certId = formData.get('certId') as string;
  const status = formData.get('status') as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  await staffService.verifyCertification(certId, status, user.id);
  revalidatePath('/staff/verify');
}

export async function deleteStudent(formData: FormData) {
  const studentId = formData.get('studentId') as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  await studentService.deleteStudent(studentId);
  revalidatePath('/staff/students');
}
