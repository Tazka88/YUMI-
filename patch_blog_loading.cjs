const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin/BlogAdmin.tsx', 'utf8');

const target = `const fetchData = async () => {
    try {
      const [resPosts, resCats] = await Promise.all([`;

const replacement = `const fetchData = async () => {
    setLoading(true);
    try {
      const [resPosts, resCats] = await Promise.all([`;

const target2 = `toast.error('Erreur lors du chargement des données');
    }
  };`;

const replacement2 = `toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(target, replacement);
code = code.replace(target2, replacement2);

fs.writeFileSync('src/pages/Admin/BlogAdmin.tsx', code);
console.log('Patched BlogAdmin loading');
