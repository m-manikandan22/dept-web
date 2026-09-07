import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const batchRepository = {
  async getAll() {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(name: string) {
    const { data, error } = await supabase
      .from('batches')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getByName(name: string) {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('name', name)
      .single();
    if (error) throw error;
    return data;
  }
};
