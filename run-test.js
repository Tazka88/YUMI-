const { createClient } = require('@supabase/supabase-js');
let supabaseUrl = process.env.SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
console.log('URL:', supabaseUrl);
console.log('KEY:', supabaseKey ? 'present' : 'missing');
if (!supabaseUrl || !supabaseKey) {
  console.log('NULL');
} else {
  console.log('CREATED');
}
