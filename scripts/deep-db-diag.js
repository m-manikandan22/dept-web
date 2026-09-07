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

async function runDiag() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const adminClient = createClient(url, serviceKey);
  const client = createClient(url, anonKey);

  console.log('--- SUPABASE CONNECTION VERIFICATION ---');
  console.log('URL:', url);
  
  try {
    // 1. Setup a dedicated diagnostic user
    const email = `diag-user-${Date.now()}@example.com`;
    const password = 'Password123!';
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authError) throw authError;
    const user = authData.user;

    const { data: student, error: sError } = await adminClient
      .from('students')
      .insert({ name: 'Diag Student', register_number: `REG-DIAG-${Date.now()}`, status: 'ACTIVE' })
      .select().single();
    if (sError) throw sError;
    const studentId = student.id;

    await adminClient.from('profiles').insert({
      user_id: user.id,
      role: 'STUDENT',
      student_id: studentId
    });

    // Login to get session
    const { data: sessionData, error: loginError } = await client.auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    client.auth.setSession(sessionData.session.access_token);

    console.log('\n--- AUTHENTICATED SESSION DIAGNOSTICS ---');
    console.log('Auth User ID:', user.id);
    console.log('Auth Email:', email);
    
    const { data: prof } = await client.from('profiles').select().eq('user_id', user.id).single();
    console.log('Profile User ID:', prof?.user_id);
    console.log('Profile Student ID:', prof?.student_id);
    
    const { data: stud } = await client.from('students').select().eq('id', studentId).single();
    console.log('Student Register Number:', stud?.register_number);

    // 2. LIVE RLS & POLICY VERIFICATION
    // Since we can't query pg_policies via JS, we use a "Probe" method
    console.log('\n--- LIVE TABLE PROBES (Auth Role) ---');
    const tables = ['academic_records', 'fee_structures', 'payments', 'hostel_details', 'transport_details', 'students', 'achievements', 'certifications', 'activities'];
    
    for (const table of tables) {
      console.log(`\nTable: ${table}`);
      
      // Test SELECT
      const { data: sData, error: sErr } = await client.from(table).select('*').limit(1);
      if (sErr) {
        console.log(`  SELECT: DENIED (${sErr.message})`);
      } else {
        console.log(`  SELECT: ALLOWED (${sData?.length || 0} rows returned)`);
      }

      // Test UPDATE (Attempting to update the student's own record if applicable)
      let updatePayload = {};
      if (table === 'students') updatePayload = { name: 'Updated Name' };
      else if (table === 'hostel_details') {
        // Ensure a record exists first
        await adminClient.from('hostel_details').upsert({ student_id: studentId, accommodation_type: 'Hosteller' });
        updatePayload = { accommodation_type: 'Hosteller' };
      }
      else if (table === 'transport_details') {
        await adminClient.from('transport_details').upsert({ student_id: studentId, transport_type: 'COLLEGE_BUS' });
        updatePayload = { transport_type: 'COLLEGE_BUS' };
      }
      else if (table === 'academic_records') {
        await adminClient.from('academic_records').upsert({ student_id: studentId, academic_year: '2024', semester: 1, sgpa: 9.0 });
        updatePayload = { sgpa: 9.5 };
      }
      else {
        updatePayload = { some_field: 'val' }; // Generic fail
      }

      const { error: uErr } = await client.from(table).update(updatePayload).eq('student_id', studentId).limit(1);
      if (uErr) {
        console.log(`  UPDATE: DENIED (${uErr.message})`);
      } else {
        console.log(`  UPDATE: ALLOWED`);
      }
    }

    // 3. DISTINGUISH ZERO ROWS FROM RLS
    console.log('\n--- SELECT VS RLS DISTINCTION ---');
    // We know for a fact we just inserted a student and academic record
    const { data: acad, error: acadErr } = await client.from('academic_records').select('*').eq('student_id', studentId);
    if (acadErr) {
      console.log('Academic SELECT: DENIED (Actual Error: ' + acadErr.message + ')');
    } else if (acad?.length === 0) {
      console.log('Academic SELECT: ALLOWED but ZERO ROWS');
    } else {
      console.log('Academic SELECT: ALLOWED (' + acad.length + ' rows)');
    }

    // 4. TRIGGER PROBE
    console.log('\n--- TRIGGER PROBE ---');
    // Attempt to update protected field in students
    const { error: protErr } = await client.from('students').update({ register_number: 'SPOOF' }).eq('id', studentId);
    if (protErr) {
      console.log('Student Official Update: DENIED (' + protErr.message + ')');
    } else {
      console.log('Student Official Update: ALLOWED (Trigger missing/failed)');
    }

  } catch (err) {
    console.error('Exception:', err);
  } finally {
    // Cleanup
    try {
      await adminClient.auth.admin.deleteUser(user?.id);
      await adminClient.from('students').delete().eq('id', studentId);
    } catch (e) {}
  }
}

runDiag();
