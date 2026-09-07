const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  try {
    const envFile = '.env.local';
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const lines = content.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const index = trimmed.indexOf('=');
        if (index > -1) {
          const key = trimmed.substring(0, index).trim();
          const value = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    console.error('Error loading .env.local:', e.message);
  }
}

async function diagnose() {
  loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('--- FULL REGISTRATION SEQUENCE TEST ---');

  try {
    // 1. Create a dummy student
    console.log('Step 1: Creating dummy student...');
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        register_number: 'TEST_DIAG_123',
        name: 'Diagnostic User',
        email: 'diag@example.com',
        status: 'ACTIVE',
        department: 'AI & DS'
      })
      .select('id')
      .single();

    if (studentError) {
      console.error('FAILED: Student creation failed:', JSON.stringify(studentError));
      return;
    }
    const studentId = student.id;
    console.log('SUCCESS: Student created with ID:', studentId);

    // 2. Create a dummy auth user
    console.log('Step 2: Creating dummy auth user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'diag-auth@example.com',
      password: 'Password123!',
      email_confirm: true,
    });

    if (authError) {
      console.error('FAILED: Auth user creation failed:', JSON.stringify(authError));
      // Cleanup student
      await supabase.from('students').delete().eq('id', studentId);
      return;
    }
    const userId = authUser.user.id;
    console.log('SUCCESS: Auth user created with ID:', userId);

    // 3. Create profile
    console.log('Step 3: Attempting profile INSERT...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        student_id: studentId,
        role: 'STUDENT'
      });

    if (profileError) {
      console.error('FAILED: Profile INSERT failed:', JSON.stringify(profileError));
    } else {
      console.log('SUCCESS: Profile INSERT successful');
    }

    // Cleanup
    console.log('Cleaning up test records...');
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from('students').delete().eq('id', studentId);
    console.log('Cleanup complete.');

  } catch (err) {
    console.error('Unexpected exception:', err);
  }
}

diagnose();
