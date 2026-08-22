const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin/Dashboard.tsx', 'utf8');

const oldTruncate = `const smartTruncate = (text: string, max: number) => {
                          if (text.length <= max) return text;
                          const truncated = text.substring(0, max);
                          const lastSpaceIndex = truncated.lastIndexOf(' ');
                          return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '...' : truncated + '...';
                        };`;

const newTruncate = `const smartTruncate = (text: string, max: number) => {
                          if (text.length <= max) return text;
                          const truncated = text.substring(0, max);
                          const lastSpaceIndex = truncated.lastIndexOf(' ');
                          let cleaned = lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;
                          return cleaned.replace(/\\.+$/, '').trim();
                        };`;

content = content.replace(oldTruncate, newTruncate);
fs.writeFileSync('src/pages/Admin/Dashboard.tsx', content);
console.log('Patched Admin Dashboard');
