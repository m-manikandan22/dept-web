import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const feeRepository = {
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('fees')
      .select('*')
      .eq('student_id', studentId);
    if (error) throw error;
    return data;
  },

  async create(feeData: any) {
    const { data, error } = await supabase
      .from('fees')
      .insert(feeData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('fees')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
