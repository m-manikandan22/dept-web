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

  console.log('--- PROFILES PERMISSION DIAGNOSTICS ---');

  try {
    // 1. Test if Admin Client can actually insert into profiles
    // We use a dummy insert that we will immediately rollback or use a non-existent ID
    // to check the PERMISSION error vs a CONSTRAINT error.
    console.log('Testing INSERT on public.profiles...');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ user_id: '00000000-0000-0000-0000-000000000000', role: 'STUDENT', student_id: '00000000-0000-0000-0000-000000000000' });

    if (insertError) {
      console.log('Insert Result Error:', JSON.stringify(insertError));
      if (insertError.code === '42501') {
        console.log('VERDICT: Table-level PERMISSION DENIED (42501)');
      } else if (insertError.code === '23503') {
        console.log('VERDICT: Permission OK, but Foreign Key Constraint failed (expected for dummy IDs)');
      } else {
        console.log('VERDICT: Other error: ' + insertError.message);
      }
    } else {
      console.log('VERDICT: INSERT SUCCESSFUL');
    }

    // 2. Query actual grants from information_schema
    console.log('\nChecking information_schema.role_table_grants for service_role...');
    const { data: grants, error: grantError } = await supabase.rpc('get_table_grants', {
        t_name: 'profiles',
        r_name: 'service_role'
    });
    // Note: since we can't create RPCs easily, we'll try a raw query via a custom function if it existed,
    // but we can't. Instead, we'll just rely on the insert result above.

    // Since we cannot run arbitrary SQL via the JS client (only through the dashboard/migrations),
    // the INSERT result is our best evidence of the current effective privilege.

  } catch (err) {
    console.error('Unexpected exception:', err);
  }
}

diagnose();
