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

  console.log('--- DATABASE ARCHITECTURE DIAGNOSTICS ---');

  try {
    // 1. Check for existing migrations in Supabase's internal table
    // We can't run raw SQL via JS client, but we try to see if the migrations table exists
    // and if the records for 006 or 007 exist.
    console.log('\nChecking for migrations in supabase_migrations.schema_migrations...');
    const { data: migrations, error: migError } = await adminClient
      .from('supabase_migrations.schema_migrations')
      .select('*');
    
    if (migError) {
      console.log('Could not read migrations table (likely not accessible via JS client): ' + migError.message);
    } else {
      console.log('Migration history:', JSON.stringify(migrations));
    }

    // 2. Inspect Policies
    console.log('\nInspecting RLS Policies for critical tables...');
    const tables = ['academic_records', 'fee_structures', 'payments', 'hostel_details', 'transport_details', 'students', 'achievements', 'certifications', 'activities'];
    
    for (const table of tables) {
      // We'll use a trick: we'll try a few operations to infer the policy
      // because we can't query pg_policies via JS client.
      console.log(`\nTable: ${table}`);
      
      // Try SELECT (as a dummy user)
      const { data: sData, error: sErr } = await client.from(table).select('*').limit(1);
      console.log(`  SELECT: ${sErr ? 'DENIED (' + sErr.message + ')' : 'ALLOWED'}`);
      
      // Try UPDATE (as a dummy user)
      const { error: uErr } = await client.from(table).update({}).eq('id', '00000000-0000-0000-0000-000000000000');
      console.log(`  UPDATE: ${uErr ? 'DENIED (' + uErr.message + ')' : 'ALLOWED'}`);
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

diagnose();
