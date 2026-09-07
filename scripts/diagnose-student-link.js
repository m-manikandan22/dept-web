const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envFile = '.env.local';
  if (!fs.existsSync(envFile)) {
    // Try .env if .env.local doesn't exist
    if (!fs.existsSync('.env')) throw new Error('.env or .env.local not found');
    return '.env';
  }
  return envFile;
}

async function diagnose() {
  const envPath = loadEnv();
  const content = fs.readFileSync(envPath, 'utf8');
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  console.log('--- STUDENT LINKAGE DIAGNOSTICS ---');
  console.log('Querying profiles and joined students...\n');

  try {
    // We use a raw RPC or just a series of queries since we can't do a JOIN with a complex WHERE in the JS client
    // easily without a view or function. But we can fetch both and join in JS.

    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('user_id, student_id, role');

    if (pErr) throw pErr;

    const { data: students, error: sErr } = await supabase
      .from('students')
      .select('id, register_number, name');

    if (sErr) throw sErr;

    console.log(`Found ${profiles.length} profiles and ${students.length} students.`);
    console.log('----------------------------------------------------------------------------------------------------');
    console.log('USER_ID | STUDENT_ID | ROLE | ACTUAL_ID | REG_NO | NAME | STATUS');
    console.log('----------------------------------------------------------------------------------------------------');

    profiles.forEach(p => {
      const s = students.find(student => student.id === p.student_id);

      let status = 'OK';
      if (!p.student_id) {
        status = 'Case B (Broken Link: student_id is NULL)';
      } else if (!s) {
        status = 'Case C (Broken Reference: student_id not found in students table)';
      } else if (p.role !== 'STUDENT') {
        status = 'Not a Student';
      }

      console.log(`${p.user_id} | ${p.student_id || 'NULL'} | ${p.role} | ${s?.id || 'NULL'} | ${s?.register_number || 'N/A'} | ${s?.name || 'N/A'} | ${status}`);
    });
    console.log('----------------------------------------------------------------------------------------------------');

  } catch (err) {
    console.error('Exception:', err);
  }
}

diagnose();
