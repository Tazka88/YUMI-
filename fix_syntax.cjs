const fs = require('fs');

const files = [
  'src/pages/Admin/Dashboard.tsx',
  'src/pages/Admin/BlogAdmin.tsx',
  'src/pages/Admin/PageSettings.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Find where it ends with .replace(/^-+|-+$/g, '');\n} and has another } or };
  // A simple robust fix is just replacing `}\n  };` with `}` if we find that pattern where generateSlug is defined.
  
  // Actually, in Dashboard.tsx:
  const fixReg1 = /\.replace\(\/\^\-\+\|\-\+\$\/g, ''\);\n\}\n  \};\n/g;
  code = code.replace(fixReg1, ".replace(/^-+|-+$/g, '');\n}\n");
  
  const fixReg2 = /\.replace\(\/\^\-\+\|\-\+\$\/g, ''\);\n\}\n\}\n/g;
  code = code.replace(fixReg2, ".replace(/^-+|-+$/g, '');\n}\n");

  fs.writeFileSync(file, code);
  console.log('Fixed syntax in', file);
}
