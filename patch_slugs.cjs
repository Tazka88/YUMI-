const fs = require('fs');

const replacement = `function generateSlug(text: string) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,'"]/g, '-') // Replace dots, commas, quotes with hyphens
    .trim()
    .replace(/[^a-z0-9\\s-]/g, '') // Keep letters, numbers, spaces, hyphens
    .replace(/[\\s-]+/g, '-') // Collapse multiple spaces/hyphens
    .replace(/^-+|-+$/g, '');
}`;

const files = [
  'src/pages/Admin/Dashboard.tsx',
  'src/pages/Admin/BlogAdmin.tsx',
  'src/pages/Admin/PageSettings.tsx',
  'src/api/routes.ts'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Dashboard, PageSettings, BlogAdmin
  code = code.replace(/export function generateSlug[\s\S]*?\}\n/g, replacement.replace('function generateSlug', 'export function generateSlug') + '\n');
  code = code.replace(/const generateSlug = \(text: string\) => \{[\s\S]*?\}\n/g, replacement.replace('function generateSlug(text: string) {', 'const generateSlug = (text: string) => {') + '\n');
  code = code.replace(/const generateSlug = \(title: string\) => \{[\s\S]*?\}\n/g, replacement.replace('function generateSlug(text: string) {', 'const generateSlug = (title: string) => {').replace(/text/g, 'title') + '\n');
  
  // routes.ts
  code = code.replace(/function generateSlug\(str: string\): string \{[\s\S]*?\}\n/g, replacement.replace('function generateSlug(text: string) {', 'function generateSlug(str: string): string {').replace(/text/g, 'str') + '\n');

  fs.writeFileSync(file, code);
  console.log('Patched', file);
}
