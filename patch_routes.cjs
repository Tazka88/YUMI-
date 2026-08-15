const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');
code = code.replace("const supabase = getSupabase();", "const supabase = getSupabase();\n    console.log('Upload Route - Supabase Instance:', !!supabase);");
fs.writeFileSync('src/api/routes.ts', code);
