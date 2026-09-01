import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const academicRepository = {
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('academic_records')
      .select('*')
      .eq('student_id', studentId)
      .order('semester', { ascending: true });
    if (error) throw error;
    return data;
  },

  async upsert(record: any) {
    const { data, error } = await supabase
      .from('academic_records')
      .upsert(record, { onConflict: 'student_id, academic_year, semester' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
