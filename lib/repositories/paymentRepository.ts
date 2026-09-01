import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const paymentRepository = {
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*, fees(fee_type, total_amount)')
      .eq('student_id', studentId);
    if (error) throw error;
    return data;
  },

  async create(paymentData: any) {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
