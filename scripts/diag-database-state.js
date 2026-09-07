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

async function diagnose() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const adminClient = createClient(url, serviceKey);
  const client = createClient(url, anonKey);

  console.log('--- DATABASE STATE DIAGNOSTICS ---');

  try {
    // Setup test user
    const email = `diag-${Date.now()}@example.com`;
    const { data: authData } = await adminClient.auth.admin.createUser({ email, password: 'Password123!', email_confirm: true });
    const user = authData.user;
    const { data: student } = await adminClient.from('students').insert({ name: 'Diag', register_number: `REG-D-${Date.now()}`, status: 'ACTIVE' }).select().single();
    await adminClient.from('profiles').insert({ user_id: user.id, role: 'STUDENT', student_id: student.id });
    
    const { data: sessionData } = await client.auth.signInWithPassword({ email, password: 'Password123!' });
    client.auth.setSession(sessionData.session.access_token);

    const tables = ['academic_records', 'hostel_details', 'transport_details', 'fee_structures'];
    for (const table of tables) {
      console.log(`\nTesting table: ${table}`);
      
      // Test SELECT
      const { data, error: sErr } = await client.from(table).select().eq('student_id', student.id);
      console.log(`SELECT: ${sErr ? 'ERR: ' + sErr.message : 'OK'}`);

      // Test UPDATE
      const { error: uErr } = await client.from(table).update({ student_id: student.id }).eq('student_id', student.id);
      console.log(`UPDATE: ${uErr ? 'ERR: ' + uErr.message : 'OK'}`);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

diagnose();
