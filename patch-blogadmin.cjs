const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin/BlogAdmin.tsx', 'utf-8');

code = code.replace(
  "      if (!res.ok) throw new Error();\n      const data = await res.json();\n      setEditingPost(prev => ({ ...prev, [fieldName]: data.url }));\n      toast.success('Image téléchargée');\n    } catch {\n      toast.error('Erreur lors du téléchargement');\n    }",
  "      if (!res.ok) {\n        const errorData = await res.json().catch(() => null);\n        throw new Error(errorData?.error || 'Erreur lors du téléchargement');\n      }\n      const data = await res.json();\n      setEditingPost(prev => ({ ...prev, [fieldName]: data.url }));\n      toast.success('Image téléchargée');\n    } catch (err: any) {\n      toast.error(err.message || 'Erreur lors du téléchargement');\n    }"
);

fs.writeFileSync('src/pages/Admin/BlogAdmin.tsx', code);
