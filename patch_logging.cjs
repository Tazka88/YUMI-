const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const slug = req.path.split('/')[2];\n          const [category] = await sql",
  "const slug = req.path.split('/')[2];\n          console.log('SSR CATEGORY REQUEST for slug:', slug);\n          console.log('categorySEOData available?', !!categorySEOData[slug]);\n          const [category] = await sql"
);

code = code.replace(
  "if (categorySEOData[slug]) {\n              title = categorySEOData[slug].title;",
  "if (categorySEOData[slug]) {\n              console.log('Using categorySEOData for category:', slug);\n              title = categorySEOData[slug].title;"
);

code = code.replace(
  "} else {\n              title = `${category.name} | ZORANDO`;",
  "} else {\n              console.log('Fallback title for category:', category.name);\n              title = `${category.name} | ZORANDO`;"
);

code = code.replace(
  "let finalHtml = template.replace('<!--seo-injection-->'",
  "console.log('Final title to inject:', title);\n        let finalHtml = template.replace('<!--seo-injection-->'"
);

fs.writeFileSync('server.ts', code);
