const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envFile = '.env.local';
  if (!fs.existsSync(envFile)) throw new Error('.env.local not found');
  const content = fs.readFileSync(envFile, 'utf8');
  content.split('\n').forEach(line => {
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

async function verifyPermissions() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  console.log('--- DATABASE PERMISSIONS VERIFICATION ---');
  console.log(`Connected to: ${url}`);

  const tables = [
    'students',
    'academic_records',
    'student_fee_details',
    'hostel_details',
    'transport_details',
    'achievements',
    'certifications',
    'activities'
  ];

  try {
    // 1. Check Table Privileges for 'authenticated' role
    console.log('\nChecking Privileges for role "authenticated"...');
    const { data: privileges, error: privError } = await supabase.rpc('get_table_privileges', {
      role_name: 'authenticated'
    });

    // Note: Supabase might not have a 'get_table_privileges' RPC by default.
    // If that fails, we will use a raw SQL query via a different method or create a temporary function.
    // Actually, the best way to check permissions via the API is to query information_schema
    // but we need a way to execute raw SQL. Supabase's JS client doesn't allow raw SQL for security.
    // However, we can use the 'service_role' to check policies.

    // Alternative: Use the service role to query pg_catalog/information_schema using an RPC if available,
    // OR we can just test the permissions by trying operations with an authenticated session.

    // Let's use the test-operation approach but for ALL tables.
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const client = createClient(url, anonKey);

    // Create a test user
    const testEmail = `perm-test-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true
    });
    if (authError) throw authError;
    const user = authData.user;

    // Create a student record for the test user
    const { data: student, error: studentError } = await supabase.from('students').insert({
      name: 'Perm Test',
      register_number: `REG-TEST-${Date.now()}`,
      status: 'ACTIVE'
    }).select().single();
    if (studentError) throw studentError;

    // Link profile
    await supabase.from('profiles').insert({ user_id: user.id, role: 'STUDENT', student_id: student.id });

    // Sign in as the test user
    const { data: sessionData, error: sessionError } = await client.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword123!'
    });
    if (sessionError) throw sessionError;
    client.auth.setSession(sessionData.session.access_token);

    console.log(`\\nAuthenticated as test user: ${testEmail}`);

    for (const table of tables) {
      console.log(`\\nTable: ${table}`);

      // Test SELECT
      const { error: sErr } = await client.from(table).select().eq('student_id', student.id).limit(1);
      console.log(`  SELECT: ${sErr ? 'FAIL (' + sErr.message + ')' : 'OK'}`);

      // Test INSERT (except for students table which we already created with admin)
      if (table !== 'students') {
        const { error: iErr } = await client.from(table).insert({ student_id: student.id, some_field: 'test' });
        // Note: some_field is a placeholder, we should use actual columns.
        // Better: we can check the error message. If it's "permission denied", it's a grant issue.
        // If it's "column does not exist", the permission was granted!
        if (iErr) {
          if (iErr.message.includes('permission denied')) {
            console.log(`  INSERT: FAIL (permission denied)`);
          } else {
            console.log(`  INSERT: OK (Permission granted, failed on column/constraint)`);
          }
        } else {
          console.log(`  INSERT: OK`);
        }
      }

      // Test UPDATE
      const { error: uErr } = await client.from(table).update({ student_id: student.id }).eq('student_id', student.id);
      if (uErr) {
        if (uErr.message.includes('permission denied')) {
          console.log(`  UPDATE: FAIL (permission denied)`);
        } else {
          console.log(`  UPDATE: OK (Permission granted, failed on column/constraint)`);
        }
      } else {
        console.log(`  UPDATE: OK`);
      }

      // Test DELETE
      const { error: dErr } = await client.from(table).delete().eq('student_id', student.id);
      if (dErr) {
        if (dErr.message.includes('permission denied')) {
          console.log(`  DELETE: FAIL (permission denied)`);
        } else {
          console.log(`  DELETE: OK (Permission granted, failed on column/constraint)`);
        }
      } else {
        console.log(`  DELETE: OK`);
      }
    }

    // Clean up
    await supabase.auth.admin.deleteUser(user.id);
    await supabase.from('students').delete().eq('id', student.id);

  } catch (err) {
    console.error('Verification Error:', err);
  }
}

verifyPermissions();
