import { createClient } from '@supabase/supabase-js';

async function diagnose() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const testRegNo = '610823U243031';

  console.log('--- SUPABASE DIAGNOSTICS ---');

  try {
    // 1. Verify students table exists and count records
    const { count, error: countError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Students table error:', countError.message);
    } else {
      console.log(`Total students in database: ${count}`);
    }

    // 2. Verify specific student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, register_number, name, email, status')
      .eq('register_number', testRegNo)
      .single();

    if (studentError) {
      console.log(`Student ${testRegNo} NOT FOUND: ${studentError.message}`);
    } else {
      console.log('Student FOUND:');
      console.log(JSON.stringify(student, null, 2));
    }

    // 3. Fuzzy search for formatting issues
    const { data: fuzzy, error: fuzzyError } = await supabase
      .from('students')
      .select('register_number, name')
      .ilike('register_number', `%${testRegNo.slice(-6)}%`);

    if (fuzzyError) {
      console.error('Fuzzy search error:', fuzzyError.message);
    } else {
      console.log(`Fuzzy search results for last 6 digits (${testRegNo.slice(-6)}):`);
      console.log(fuzzy);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

diagnose();
