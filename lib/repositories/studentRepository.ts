import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Server-side repository uses service role for full control
const supabase = createClient(supabaseUrl, supabaseKey);

export const studentRepository = {
  async getAll(filters: { batch?: string; section?: string; search?: string } = {}) {
    let query = supabase
      .from('students')
      .select('*, batches(name)');

    if (filters.batch) {
      query = query.eq('batches(name)', filters.batch);
    }
    if (filters.section) {
      query = query.eq('section', filters.section);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,register_number.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getByRegisterNumber(regNo: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('register_number', regNo)
      .single();

    if (error) throw error;
    return data;
  },

  async create(studentData: any) {
    // First ensure batch exists or create it
    let batchId: string | null = null;
    if (studentData.batch) {
      const { data: batch } = await supabase
        .from('batches')
        .select('id')
        .eq('name', studentData.batch)
        .single();

      if (batch) {
        batchId = batch.id;
      } else {
        const { data: newBatch } = await supabase
          .from('batches')
          .insert({ name: studentData.batch })
          .select()
          .single();
        batchId = newBatch?.id || null;
      }
    }

    const { data, error } = await supabase
      .from('students')
      .insert({
        ...studentData,
        batch_id: batchId,
        // Map other fields if names differ
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updateData: any) {
    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    // Mark as inactive instead of hard delete to preserve history
    return this.update(id, { status: 'INACTIVE' });
  },
};
