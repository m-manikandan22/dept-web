import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const achievementRepository = {
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('student_id', studentId);
    if (error) throw error;
    return data;
  },

  async create(achievementData: any) {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievementData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
