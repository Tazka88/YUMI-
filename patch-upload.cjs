const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf-8');

// Replace the fallback for /reviews/upload
code = code.replace(
  "    } else {\n      const base64 = buffer.toString('base64');\n      res.json({ url: `data:${contentType};base64,${base64}` });\n    }",
  "    } else {\n      return res.status(500).json({ error: 'Supabase storage is not configured (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing)' });\n    }"
);

// Replace the fallback for /admin/upload
code = code.replace(
  "    } else {\n      const base64 = buffer.toString('base64');\n      res.json({ url: `data:${contentType};base64,${base64}` });\n    }",
  "    } else {\n      return res.status(500).json({ error: 'Supabase storage is not configured (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing)' });\n    }"
);

fs.writeFileSync('src/api/routes.ts', code);
