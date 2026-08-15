const fs = require('fs');

// 1. Fix server.ts typescript issues
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace("const schemaOffer = {", "const schemaOffer: any = {");
code = code.replace("const productSchema = {", "const productSchema: any = {");
code = code.replace("const PORT = process.env.PORT || 3000;", "const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;");
fs.writeFileSync('server.ts', code);

// 2. Fix ProductCard.tsx
let pcCode = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8');
pcCode = pcCode.replace(
  "  is_new?: boolean;\n}",
  "  is_new?: boolean;\n  promo_price_start_date?: string;\n  promo_price_end_date?: string;\n}"
);
fs.writeFileSync('src/components/ProductCard.tsx', pcCode);

// 3. Fix cartStore.ts sku duplicate
let csCode = fs.readFileSync('src/store/cartStore.ts', 'utf-8');
// The duplicate is likely because sku is defined twice in the interface
csCode = csCode.replace(/  sku\?: string;\n/g, "");
csCode = csCode.replace(/  is_active\?: boolean;\n/, "  is_active?: boolean;\n  sku?: string;\n");
fs.writeFileSync('src/store/cartStore.ts', csCode);

