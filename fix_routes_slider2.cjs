const fs = require('fs');
let content = fs.readFileSync('src/api/routes.ts', 'utf8');

const regex = /sliderImages\.forEach\(\(s: any\) => \{[\s\S]*?\}\);/g;

if (regex.test(content)) {
  content = content.replace(regex, `// Bypassing processImage to serve raw Supabase URLs for optimal LCP`);
  fs.writeFileSync('src/api/routes.ts', content);
  console.log("Fixed routes.ts - removed processImage for slider");
} else {
  console.log("Regex not found in routes.ts");
}
