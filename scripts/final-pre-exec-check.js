const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envFile = '.env.local';
  const path = fs.existsSync(envFile) ? envFile : '.env';
  if (!fs.existsSync(path)) throw new Error('No .env or .env.local found');
  const content = fs.readFileSync(path, 'utf8');
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  const tables = [
    'students',
    'profiles',
    'academic_records',
    'student_fee_details',
    'hostel_details',
    'transport_details',
    'achievements',
    'certifications',
    'activities'
  ];

  console.log('--- LIVE DATABASE VERIFICATION ---\n');

  // 1. Verify Helper Functions
  console.log('Checking Helper Functions:');
  try {
    const { data: role, error: rErr } = await supabase.rpc('get_my_role');
    console.log(`- get_my_role(): ${rErr ? '❌ ' + rErr.message : '✅ EXISTS'}`);
  } catch (e) { console.log(`- get_my_role(): ❌ Exception ${e.message}`); }

  try {
    const { data: sid, error: sErr } = await supabase.rpc('get_my_student_id');
    console.log(`- get_my_student_id(): ${sErr ? '❌ ' + sErr.message : '✅ EXISTS'}`);
  } catch (e) { console.log(`- get_my_student_id(): ❌ Exception ${e.message}`); }

  // 2. Verify Table Existence (using service_role)
  console.log('\nChecking Table Existence:');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`- ${table}: ❌ ${error.message}`);
    } else {
      console.log(`- ${table}: ✅ EXISTS`);
    }
  }

  // 3. Attempt to probe policies (via RPC if possible, otherwise report limitation)
  console.log('\nChecking RLS/Privilege Metadata:');
  console.log('Note: Supabase API does not expose pg_policies or information_schema by default.');

  // Try to see if a generic metadata RPC exists
  const { data: meta, error: mErr } = await supabase.rpc('get_table_metadata', { table_name: 'students' });
  if (mErr) {
    console.log(`- Metadata RPC: ⚠️ Not found or inaccessible (${mErr.message})`);
  } else {
    console.log(`- Metadata RPC: ✅ Available`);
  }

  console.log('\n--- DIAGNOSTIC COMPLETE ---');
}

diagnose();
