const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `        let reqCanonicalPath = req.path;
        if (reqCanonicalPath.length > 1 && reqCanonicalPath.endsWith('/')) {
            reqCanonicalPath = reqCanonicalPath.slice(0, -1);
        }
        let headHtml = \`<link data-rh="true" rel="canonical" href="\${baseUrl}\${reqCanonicalPath}" />\`;`;

const replacement = `        let reqCanonicalPath = req.path;
        if (reqCanonicalPath.length > 1 && reqCanonicalPath.endsWith('/')) {
            reqCanonicalPath = reqCanonicalPath.slice(0, -1);
        }
        
        let structuralQuery = '';
        if (req.query.sub === 'true' || req.query.subsub === 'true') {
          const params = new URLSearchParams();
          if (req.query.sub === 'true') params.set('sub', 'true');
          if (req.query.subsub === 'true') params.set('subsub', 'true');
          structuralQuery = '?' + params.toString();
        }
        
        let headHtml = \`<link data-rh="true" rel="canonical" href="\${baseUrl}\${reqCanonicalPath}\${structuralQuery}" />\`;`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(file, code);
    console.log("server.ts canonical patched successfully.");
} else {
    console.log("Could not find target in server.ts");
}
