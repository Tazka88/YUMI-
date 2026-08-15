const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');
code = code.replace("console.log('SUPABASE_URL:', process.env.SUPABASE_URL);", "");
code = code.replace("console.log('Upload Route - Supabase Instance:', !!supabase);", "");
fs.writeFileSync('src/api/routes.ts', code);
