const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

const regexUpload = /\} catch \(supabaseError\) \{\s*console\.error\('Supabase upload failed, falling back to base64:', supabaseError\);\s*\/\/ Fallback to base64 below\s*\}\s*\}\s*\/\/ Fallback to base64 if Supabase is not configured or fails\s*const base64 = buffer\.toString\('base64'\);\s*res\.json\(\{ url: `data:\$\{contentType\};base64,\$\{base64\}` \}\);/g;

code = code.replace(regexUpload, `} catch (supabaseError) {
        console.error('Supabase upload failed:', supabaseError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    } else {
      const base64 = buffer.toString('base64');
      res.json({ url: \`data:\${contentType};base64,\${base64}\` });
    }`);

const regexAdmin = /\} catch \(supabaseError\) \{\s*console\.error\('Supabase upload error, falling back to base64:', supabaseError\);\s*\/\/ Fallback to base64 below\s*\}\s*\}\s*\/\/ Fallback to base64 if Supabase is not configured\s*const base64 = buffer\.toString\('base64'\);\s*res\.json\(\{ url: `data:\$\{contentType\};base64,\$\{base64\}` \}\);/g;

code = code.replace(regexAdmin, `} catch (supabaseError) {
        console.error('Supabase upload error:', supabaseError);
        return res.status(500).json({ error: 'Failed to process image' });
      }
    } else {
      const base64 = buffer.toString('base64');
      res.json({ url: \`data:\${contentType};base64,\${base64}\` });
    }`);

fs.writeFileSync('src/api/routes.ts', code);
