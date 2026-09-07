'use server';

import { batchRepository } from '@/lib/repositories/batchRepository';
import { revalidatePath } from 'next/cache';

export async function createBatch(formData: FormData) {
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

export async function deleteBatch(id: string) {
  try {
    await batchRepository.delete(id);
    revalidatePath('/admin/batches');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
