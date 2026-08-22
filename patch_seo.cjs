const fs = require('fs');

const replacement = `const cleanForSEO = (text, truncateLength) => {
  if (!text) return '';
  let cleaned = text.replace(/<[^>]+>/g, ' ')
                    .replace(/(?:\\*\\*|\\*|__|_|#|>|\`|~)/g, '')
                    .replace(/\\s+/g, ' ')
                    .trim();
  if (truncateLength && cleaned.length > truncateLength) {
    let truncated = cleaned.substring(0, truncateLength);
    let lastSpace = truncated.lastIndexOf(' ');
    cleaned = truncated.substring(0, lastSpace > 0 ? lastSpace : truncateLength);
  }
  return cleaned.replace(/\\.+$/, '').trim();
};`;

function patchCleanForSeo(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  // Regex to match the entire const cleanForSEO function block
  const blockRegex = /const cleanForSEO = \(text, truncateLength\) => \{[\s\S]*?\n\};\n?/m;
  if (blockRegex.test(content)) {
    content = content.replace(blockRegex, replacement + '\n');
    fs.writeFileSync(filepath, content);
    console.log('Patched ' + filepath);
  } else {
    console.log('Could not find cleanForSEO block in ' + filepath);
  }
}

patchCleanForSeo('server.ts');
patchCleanForSeo('api/index.ts');
