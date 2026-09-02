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

  console.log('--- DATABASE ACCESS DIAGNOSTICS ---');

  try {
    // Try a very simple select
    const { data, error } = await supabase.from('students').select('id').limit(1);
    if (error) {
      console.log('Simple SELECT students ERROR:', JSON.stringify(error));
    } else {
      console.log('Simple SELECT students SUCCESS:', JSON.stringify(data));
    }
  } catch (e) {
    console.log('EXCEPTION:', e.message);
  }
}

diagnose();
