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

  console.log('--- STARTING PERMISSION TESTS ---');

  let testUser = null;
  let testStudentId = null;

  try {
    // 1. Create a test user
    const email = `test-cert-${Date.now()}@example.com`;
    const password = 'Password123!';
    console.log(`Creating test user: ${email}...`);
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;
    testUser = authData.user;

    // 2. Create student and profile for this user
    console.log('Creating student and profile...');
    const { data: student, error: studentError } = await adminClient
      .from('students')
      .insert({ name: 'Test Student', register_number: `REG-${Date.now()}`, status: 'ACTIVE' })
      .select()
      .single();

    if (studentError) throw studentError;
    testStudentId = student.id;

    await adminClient.from('profiles').insert({
      user_id: testUser.id,
      role: 'STUDENT',
      student_id: testStudentId
    });

    // 3. Login as the student
    console.log('Logging in as student...');
    const { data: sessionData, error: loginError } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) throw loginError;
    const session = sessionData.session;
    client.auth.setSession(session.access_token);

    // --- TEST CASE A: Student inserts their own certification ---
    console.log('\nTesting Case A: Insert own certification...');
    const { error: aError } = await client
      .from('certifications')
      .insert({
        student_id: testStudentId,
        course_name: 'Permission Test Course',
        platform: 'Test Platform'
      });

    if (aError) {
      console.log('Case A RESULT: FAILED - ' + JSON.stringify(aError));
    } else {
      console.log('Case A RESULT: SUCCESS');
    }

    // --- TEST CASE B: Student attempts to insert another student's certification ---
    console.log('\nTesting Case B: Insert another student certification...');
    // Create another student for testing
    const { data: otherStudent, error: osError } = await adminClient
      .from('students')
      .insert({ name: 'Other Student', register_number: `REG-OTHER-${Date.now()}`, status: 'ACTIVE' })
      .select()
      .single();
    
    if (osError) throw osError;

    const { error: bError } = await client
      .from('certifications')
      .insert({
        student_id: otherStudent.id,
        course_name: 'Evil Certification',
        platform: 'Evil Platform'
      });

    if (bError && (bError.code === '42501' || bError.message.includes('policy'))) {
      console.log('Case B RESULT: SUCCESS (Denied as expected) - ' + bError.message);
    } else if (!bError) {
      console.log('Case B RESULT: FAILED (Allowed but should have been denied)');
    } else {
      console.log('Case B RESULT: UNEXPECTED ERROR - ' + JSON.stringify(bError));
    }

  } catch (err) {
    console.error('Test Exception:', err);
  } finally {
    // Cleanup
    if (testUser) {
      console.log('\nCleaning up test user...');
      await adminClient.auth.admin.deleteUser(testUser.id);
    }
    if (testStudentId) {
      await adminClient.from('students').delete().eq('id', testStudentId);
    }
  }
}

runTest();
