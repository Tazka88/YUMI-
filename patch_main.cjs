const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const target = "createRoot(document.getElementById('root')!).render(";
const replacement = `// Nettoyer les balises SEO injectées par le SSR avant que React 19 ne les injecte à nouveau
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-rh="true"]').forEach(el => el.remove());
}

createRoot(document.getElementById('root')!).render(`;

if(code.includes(target) && !code.includes('Nettoyer')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/main.tsx', code);
  console.log("main.tsx patched");
} else {
  console.log("main.tsx not patched");
}
