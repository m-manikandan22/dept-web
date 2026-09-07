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

async function runTest() {
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

  console.log('--- STARTING COMPREHENSIVE STUDENT CRUD RUNTIME TESTS ---');

  let testUser = null;
  let testStudentId = null;
  const results = [];

  function record(module, operation, result, securityResult = 'N/A', error = '') {
    results.push({ module, operation, result, securityResult, error });
  }

  try {
    // 1. Setup Test User
    const email = `audit-student-${Date.now()}@example.com`;
    const password = 'Password123!';
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authError) throw authError;
    testUser = authData.user;

    const { data: student, error: sError } = await adminClient
      .from('students')
      .insert({
        name: 'Audit Student',
        register_number: `REG-AUDIT-${Date.now()}`,
        email,
        status: 'ACTIVE',
        semester: 1,
        department: 'CS'
      })
      .select().single();
    if (sError) throw sError;
    testStudentId = student.id;

    await adminClient.from('profiles').insert({
      user_id: testUser.id,
      role: 'STUDENT',
      student_id: testStudentId
    });

    // Login
    const { data: sessionData, error: loginError } = await client.auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
    client.auth.setSession(sessionData.session.access_token);

    // --- TEST 1: ACHIEVEMENTS ---
    console.log('\nTesting Achievements...');
    const { error: achInErr } = await client.from('achievements').insert({
      student_id: testStudentId, event_name: 'Test Ach', category: 'Academic'
    });
    if (achInErr) record('Achievements', 'INSERT', 'FAIL', 'N/A', achInErr.message);
    else {
      record('Achievements', 'INSERT', 'PASS', 'N/A');
      const { data: achData } = await client.from('achievements').select().eq('student_id', testStudentId).single();
      const achId = achData.id;

      const { error: achUpErr } = await client.from('achievements').update({ event_name: 'Updated Ach' }).eq('id', achId);
      if (achUpErr) record('Achievements', 'UPDATE', 'FAIL', 'N/A', achUpErr.message);
      else record('Achievements', 'UPDATE', 'PASS', 'N/A');

      const { error: achDelErr } = await client.from('achievements').delete().eq('id', achId);
      if (achDelErr) record('Achievements', 'DELETE', 'FAIL', 'N/A', achDelErr.message);
      else record('Achievements', 'DELETE', 'PASS', 'N/A');
    }

    // Cross-student Ownership: Achievements
    const { data: otherS, error: otherSInErr } = await adminClient.from('students').insert({ name: 'Other', register_number: `REG-OTHER-${Date.now()}`, status: 'ACTIVE' }).select().single();
    if (otherSInErr) throw otherSInErr;
    const { error: achCrossErr } = await client.from('achievements').insert({ student_id: otherS.id, event_name: 'Evil' });
    record('Achievements', 'CROSS-INSERT', achCrossErr ? 'PASS' : 'FAIL', achCrossErr ? 'RLS DENIED' : 'ALLOWED', achCrossErr?.message);

    // --- TEST 2: ACTIVITIES ---
    console.log('Testing Activities...');
    const { error: actInErr } = await client.from('activities').insert({
      student_id: testStudentId, activity_name: 'Test Act'
    });
    if (actInErr) record('Activities', 'INSERT', 'FAIL', 'N/A', actInErr.message);
    else {
      record('Activities', 'INSERT', 'PASS', 'N/A');
      const { data: actData } = await client.from('activities').select().eq('student_id', testStudentId).single();
      const actId = actData.id;
      const { error: actUpErr } = await client.from('activities').update({ activity_name: 'Updated Act' }).eq('id', actId);
      record('Activities', 'UPDATE', actUpErr ? 'FAIL' : 'PASS', 'N/A', actUpErr?.message);
      const { error: actDelErr } = await client.from('activities').delete().eq('id', actId);
      record('Activities', 'DELETE', actDelErr ? 'FAIL' : 'PASS', 'N/A', actDelErr?.message);
    }

    // --- TEST 3: PROFILE ---
    console.log('Testing Profile...');
    const { error: profUpErr } = await client.from('students').update({ phone: '1234567890', address: 'Test Ave' }).eq('id', testStudentId);
    record('Profile', 'UPDATE PERMITTED', profUpErr ? 'FAIL' : 'PASS', 'N/A', profUpErr?.message);

    const { error: profProtErr } = await client.from('students').update({ register_number: 'SPOOFED' }).eq('id', testStudentId);
    record('Profile', 'UPDATE PROTECTED', profProtErr ? 'PASS' : 'FAIL', profProtErr ? 'TRIGGER DENIED' : 'ALLOWED', profProtErr?.message);

    // --- TEST 4: HOSTEL ---
    console.log('Testing Hostel...');
    await adminClient.from('hostel_details').insert({ student_id: testStudentId, accommodation_type: 'Hosteller', hostel_name: 'Hall A' });

    const { error: hostUpErr } = await client.from('hostel_details').update({ room_number: '101' }).eq('student_id', testStudentId);
    record('Hostel', 'UPDATE PERMITTED', hostUpErr ? 'FAIL' : 'PASS', 'N/A', hostUpErr?.message);

    const { error: hostProtErr } = await client.from('hostel_details').update({ hostel_fee: 9999 }).eq('student_id', testStudentId);
    record('Hostel', 'UPDATE PROTECTED', hostProtErr ? 'PASS' : 'FAIL', hostProtErr ? 'TRIGGER DENIED' : 'ALLOWED', hostProtErr?.message);

    // --- TEST 5: TRANSPORT ---
    console.log('Testing Transport...');
    await adminClient.from('transport_details').insert({ student_id: testStudentId, transport_type: 'COLLEGE_BUS' });

    const { error: transUpErr } = await client.from('transport_details').update({ route: 'Route 1' }).eq('student_id', testStudentId);
    record('Transport', 'UPDATE PERMITTED', transUpErr ? 'FAIL' : 'PASS', 'N/A', transUpErr?.message);

    const { error: transProtErr } = await client.from('transport_details').update({ transport_fee: 9999 }).eq('student_id', testStudentId);
    record('Transport', 'UPDATE PROTECTED', transProtErr ? 'PASS' : 'FAIL', transProtErr ? 'TRIGGER DENIED' : 'ALLOWED', transProtErr?.message);

    // --- TEST 6: FEES/PAYMENTS ---
    console.log('Testing Fees/Payments...');
    await adminClient.from('fee_structures').insert({
      student_id: testStudentId, academic_year: '2024', tuition_fee: 1000, transport_fee: 200, hostel_fee: 300
    });

    const { data: feesData } = await client.from('fee_structures').select().eq('student_id', testStudentId).single();
    record('Fees', 'SELECT STRUCTURE', feesData ? 'PASS' : 'FAIL', 'N/A', 'No data');

    const { error: payRpcErr } = await client.rpc('submit_student_payment', {
      p_student_id: testStudentId, p_academic_year: '2024', p_fee_component: 'TUITION', p_amount: 100,
      p_payment_date: new Date().toISOString().split('T')[0], p_payment_mode: 'ONLINE', p_transaction_reference: 'TXN123'
    });
    record('Payments', 'RPC INSERT', payRpcErr ? 'FAIL' : 'PASS', 'N/A', payRpcErr?.message);

    const { error: payDirectErr } = await client.from('payments').insert({
      student_id: testStudentId, academic_year: '2024', fee_component: 'TUITION', amount: 10, payment_mode: 'CASH'
    });
    record('Payments', 'DIRECT INSERT', payDirectErr ? 'PASS' : 'FAIL', payDirectErr ? 'RLS DENIED' : 'ALLOWED', payDirectErr?.message);

    const { error: overpayErr } = await client.rpc('submit_student_payment', {
      p_student_id: testStudentId, p_academic_year: '2024', p_fee_component: 'TUITION', p_amount: 10000,
      p_payment_date: new Date().toISOString().split('T')[0], p_payment_mode: 'ONLINE', p_transaction_reference: 'TXN_OVER'
    });
    record('Payments', 'OVERPAYMENT', overpayErr ? 'PASS' : 'FAIL', overpayErr ? 'RPC REJECTED' : 'ALLOWED', overpayErr?.message);

    const { error: crossPayErr } = await client.rpc('submit_student_payment', {
      p_student_id: otherS.id, p_academic_year: '2024', p_fee_component: 'TUITION', p_amount: 10,
      p_payment_date: new Date().toISOString().split('T')[0], p_payment_mode: 'ONLINE', p_transaction_reference: 'TXN_CROSS'
    });
    record('Payments', 'CROSS-PAYMENT', crossPayErr ? 'PASS' : 'FAIL', crossPayErr ? 'RPC REJECTED' : 'ALLOWED', crossPayErr?.message);

    // --- TEST 7: ACADEMICS ---
    console.log('Testing Academics...');
    await adminClient.from('academic_records').insert({
      student_id: testStudentId, academic_year: '2024', semester: 1, sgpa: 9.0
    });
    const { data: acadData } = await client.from('academic_records').select().eq('student_id', testStudentId).single();
    record('Academics', 'SELECT', acadData ? 'PASS' : 'FAIL', 'N/A', 'No data');

    const { error: acadUpErr } = await client.from('academic_records').update({ sgpa: 10.0 }).eq('student_id', testStudentId);
    record('Academics', 'UPDATE', acadUpErr ? 'PASS' : 'FAIL', acadUpErr ? 'RLS DENIED' : 'ALLOWED', acadUpErr?.message);

  } catch (err) {
    console.error('Test Exception:', err);
  } finally {
    if (testUser) {
      console.log('\nCleaning up test data...');
      await adminClient.auth.admin.deleteUser(testUser.id);
      await adminClient.from('students').delete().eq('id', testStudentId);
    }

    console.log('\n--- FINAL AUDIT RESULTS ---');
    console.table(results);
  }
}

runTest();
