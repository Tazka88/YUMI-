const fs = require('fs');
let content = fs.readFileSync('src/api/routes.ts', 'utf8');

content = content.replace(/import dhdRoutes from '\.\/dhd\.js';\n/g, '');
content = content.replace(/\/\/ Mount DHD routes\nrouter\.use\('\/delivery', dhdRoutes\);\n/g, '');
content = content.replace(/\$\{delivery_company \|\| 'dhd'\}/g, "${delivery_company || 'ecomdz'}");

const officesEndpointRegex = /    \/\/ 1\. DHD offices \(from local DB as existing\)[\s\S]*?    \/\/ 2\. Ecom-DZ offices/m;
content = content.replace(officesEndpointRegex, '    // 2. Ecom-DZ offices');

const pushDhdOfficesRegex = /    if \(dhdOffices && Array\.isArray\(dhdOffices\)\) \{[\s\S]*?    \}/m;
content = content.replace(pushDhdOfficesRegex, '');

fs.writeFileSync('src/api/routes.ts', content);
console.log('patched routes.ts');
