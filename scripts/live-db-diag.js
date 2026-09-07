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

  console.log('--- LIVE DATABASE DIAGNOSTICS (API-BASED) ---\n');

  for (const table of tables) {
    console.log(`\nChecking table: ${table}`);

    // 1. Existence check
    const { data: exists, error: eExists } = await supabase
      .from(table)
      .select('id')
      .limit(1);

    if (eExists && eExists.code === 'PGRST116') {
      console.log(`- Existence: ❌ Table not found`);
      continue;
    } else if (eExists) {
      console.log(`- Existence: ❌ Error: ${eExists.message}`);
      continue;
    }
    console.log(`- Existence: ✅ Table exists`);

    // 2. Try to fetch policies from pg_policies (Usually blocked)
    const { data: policies, error: pErr } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', table);

    if (pErr) {
      console.log(`- Policies: ⚠️ Cannot access pg_policies via API (${pErr.message})`);
    } else {
      console.log(`- Policies: Found ${policies?.length || 0} policies`);
      policies?.forEach(p => console.log(`  - ${p.policyname} (${p.cmd})`));
    }

    // 3. Try to fetch privileges from information_schema.table_privileges
    const { data: privs, error: prErr } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', table);

    if (prErr) {
      console.log(`- Privileges: ⚠️ Cannot access information_schema via API (${prErr.message})`);
    } else {
      console.log(`- Privileges: Found ${privs?.length || 0} privilege entries`);
    }
  }

  // Special check for hostel_details and transport_details grants for 'authenticated'
  console.log('\n--- SPECIFIC GRANT CHECK ---');
  const targetTables = ['hostel_details', 'transport_details'];
  for (const t of targetTables) {
    const { data: p, error: e } = await supabase
      .from('information_schema.table_privileges')
      .select('privilege_type')
      .eq('table_name', t)
      .eq('grantee', 'authenticated');

    if (e) {
      console.log(`${t}: ⚠️ API Error ${e.message}`);
    } else {
      console.log(`${t} authenticated grants: ${p?.map(x => x.privilege_type).join(', ') || 'NONE'}`);
    }
  }
}

diagnose();
