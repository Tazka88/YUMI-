const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace("const schemaOffer: any = {", "const schemaOffer: Record<string, any> = {");
code = code.replace("const productSchema: any = {", "const productSchema: Record<string, any> = {");
fs.writeFileSync('server.ts', code);
