const fs = require('fs');
let code = fs.readFileSync('src/api/routes.ts', 'utf8');

const regex = /AND \(\$\{search \|\| null\}::text IS NULL OR p\.name ILIKE \$\{search \? '%' \+ search \+ '%' : null\}\)/;

const replacement = `AND (\${searchCondition})`;

// Let's insert searchCondition definition right before: const idArray = ids ? ids.split(',').map(id => Number(id)).filter(id => !isNaN(id)) : [];
const setupRegex = /const idArray = ids \? ids\.split\(\',\/\)\.map\(id => Number\(id\)\)\.filter\(id => !isNaN\(id\)\) : \[\];/;

const exactSetupRegexTarget = `const idArray = ids ? ids.split(',').map(id => Number(id)).filter(id => !isNaN(id)) : [];`;

const searchConditionSetup = `const idArray = ids ? ids.split(',').map(id => Number(id)).filter(id => !isNaN(id)) : [];
    
    let searchCondition = sql\`true\`;
    if (search) {
      const searchWords = search.trim().split(/\\s+/).filter(word => word.length > 0);
      if (searchWords.length > 0) {
        const conditions = searchWords.map(word => sql\`p.name ILIKE \${'%' + word + '%'}\`);
        searchCondition = sql\`(\${conditions.reduce((acc, curr) => sql\`\${acc} AND \${curr}\`)})\`;
      }
    }`;

if (code.includes(exactSetupRegexTarget) && regex.test(code)) {
    code = code.replace(exactSetupRegexTarget, searchConditionSetup);
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/api/routes.ts', code);
    console.log("Patched public search successfully");
} else {
    console.log("Could not find targets");
}
