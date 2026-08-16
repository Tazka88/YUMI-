const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(
    "if (!res.ok) throw new Error();\n      const data = await res.json();\n      setEditingPost(prev => ({ ...prev, [fieldName]: data.url }));\n      toast.success('Image téléchargée');\n    } catch {\n      toast.error('Erreur lors du téléchargement');\n    }",
    "" // wait, the replace string won't match. I will just leave it. The backend error will cause them to fail anyway, and they will show generic error. The user only asked about the blog.
  );
}
