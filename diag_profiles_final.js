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

  console.log('Using URL: ' + supabaseUrl);
  // Do not print the key.

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('--- PROFILES INSERT TEST ---');

  try {
    // To test a profile insert, we need a valid user_id (from auth.users)
    // and a valid student_id (from students).
    // First, let's try to find one student.
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .limit(1)
      .single();

    if (studentError) {
      console.error('Failed to fetch student for test:', studentError.message);
      // If we can't even read students, it's a wider permission issue.
    } else {
      console.log('Found student ID for test:', student.id);

      // Now let's try to create a dummy user in Auth to get a valid user_id.
      console.log('Creating temporary auth user...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'test-diag-user@example.com',
        password: 'TestPassword123!',
        email_confirm: true,
      });

      if (authError) {
        console.error('Failed to create test auth user:', authError.message);
      } else {
        const userId = authUser.user.id;
        console.log('Created test auth user ID:', userId);

        console.log('Attempting minimal profile INSERT...');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            student_id: student.id,
            role: 'STUDENT'
          });

        if (profileError) {
          console.error('Profile INSERT failed:', JSON.stringify(profileError));
        } else {
          console.log('Profile INSERT SUCCESSFUL');
        }

        // Cleanup
        console.log('Cleaning up test records...');
        await supabase.auth.admin.deleteUser(userId);
      }
    }
  } catch (err) {
    console.error('Unexpected exception:', err);
  }
}

diagnose();
