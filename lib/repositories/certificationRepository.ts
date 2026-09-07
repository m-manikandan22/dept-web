import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const certificationRepository = {
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('student_id', studentId);
    if (error) throw error;
    return data;
  },

  async create(certData: any) {
    const { data, error } = await supabase
      .from('certifications')
      .insert(certData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
