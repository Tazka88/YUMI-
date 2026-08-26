const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("finalHtml = finalHtml.replace('<!--root-injection-->', typeof rootHtml !== 'undefined' ? rootHtml : '');")) {
    code = code.replace("finalHtml = finalHtml.replace('<!--head-injection-->', (typeof headHtml !== 'undefined' ? headHtml : '') + seoTags);", 
                        "finalHtml = finalHtml.replace('<!--head-injection-->', (typeof headHtml !== 'undefined' ? headHtml : '') + seoTags);\n        finalHtml = finalHtml.replace('<!--root-injection-->', typeof rootHtml !== 'undefined' ? rootHtml : '');");
}

fs.writeFileSync('server.ts', code);
console.log("server.ts updated");
