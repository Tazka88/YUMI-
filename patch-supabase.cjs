const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf-8');

code = code.replace(
  "let supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';",
  "let supabaseUrl = (typeof process !== 'undefined' && (process.env?.SUPABASE_URL || process.env?.VITE_SUPABASE_URL)) || (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';"
);

code = code.replace(
  "const supabaseKey = (typeof process !== 'undefined' && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.SUPABASE_ANON_KEY)) \n    || (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';",
  "const supabaseKey = (typeof process !== 'undefined' && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY)) \n    || (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';"
);

fs.writeFileSync('src/lib/supabase.ts', code);
