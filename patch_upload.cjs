const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

// Patch 1: /upload route
const oldUploadCatch = `      } catch (supabaseError) {
        console.error('Supabase upload failed, falling back to base64:', supabaseError);
        // Fallback to base64 below
      }
    }
    // Fallback to base64 if Supabase is not configured or fails
    const base64 = buffer.toString('base64');
    res.json({ url: \`data:\${contentType};base64,\${base64}\` });`;

const newUploadCatch = `      } catch (supabaseError) {
        console.error('Supabase upload failed:', supabaseError);
        return res.status(500).json({ error: 'Échec de l\\'upload vers Supabase' });
      }
    } else {
      // Only used if Supabase is strictly not configured (no env vars)
      console.warn('Supabase non configuré. Utilisation du fallback Base64.');
      const base64 = buffer.toString('base64');
      res.json({ url: \`data:\${contentType};base64,\${base64}\` });
    }`;

code = code.replace(oldUploadCatch, newUploadCatch);

// Patch 2: /admin/upload route fileName
const oldAdminFileName = `        const fileName = customName 
          ? \`\${customName}-\${uniqueId}.\${ext}\`
          : \`\${Date.now()}-\${uniqueId}.\${ext}\`;`;

const newAdminFileName = `        const fileName = customName 
          ? \`uploads/\${customName}-\${uniqueId}.\${ext}\`
          : \`uploads/\${Date.now()}-\${uniqueId}.\${ext}\`;`;

code = code.replace(oldAdminFileName, newAdminFileName);

// Patch 3: /admin/upload route catch
const oldAdminCatch = `      } catch (supabaseError) {
        console.error('Supabase upload error, falling back to base64:', supabaseError);
        // Fallback to base64 below
      }
    }
    // Fallback to base64 if Supabase is not configured
    const base64 = buffer.toString('base64');
    res.json({ url: \`data:\${contentType};base64,\${base64}\` });`;

const newAdminCatch = `      } catch (supabaseError) {
        console.error('Supabase upload error:', supabaseError);
        return res.status(500).json({ error: 'Échec de l\\'upload vers Supabase' });
      }
    } else {
      // Only used if Supabase is strictly not configured (no env vars)
      console.warn('Supabase non configuré. Utilisation du fallback Base64.');
      const base64 = buffer.toString('base64');
      res.json({ url: \`data:\${contentType};base64,\${base64}\` });
    }`;

code = code.replace(oldAdminCatch, newAdminCatch);

fs.writeFileSync('src/api/routes.ts', code);
