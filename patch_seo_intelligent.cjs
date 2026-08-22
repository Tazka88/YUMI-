const fs = require('fs');

const newCleanForSEO = `const cleanForSEO = (text, truncateLength) => {
  if (!text) return '';
  const maxLength = truncateLength || 155;
  let cleanText = text.replace(/<[^>]+>/g, ' ')
                    .replace(/(?:\\*\\*|\\*|__|_|#|>|\`|~)/g, '')
                    .replace(/\\s+/g, ' ')
                    .trim();
  
  if (cleanText.length > maxLength) {
    let lastPoint = cleanText.substring(0, maxLength).lastIndexOf('.');
    if (lastPoint > maxLength * 0.7) {
      return cleanText.substring(0, lastPoint + 1).replace(/\\.{2,}$/, '').trim();
    }
    
    let lastComma = cleanText.substring(0, maxLength).lastIndexOf(',');
    if (lastComma > maxLength * 0.7) {
      return cleanText.substring(0, lastComma).replace(/\\.{2,}$/, '').trim();
    }
    
    let lastSpace = cleanText.substring(0, maxLength).lastIndexOf(' ');
    if (lastSpace > 0) {
      return cleanText.substring(0, lastSpace).replace(/\\.{2,}$/, '').trim();
    }
    
    return cleanText.substring(0, maxLength).replace(/\\.{2,}$/, '').trim();
  }
  
  return cleanText.replace(/\\.{2,}$/, '').trim();
};`;

function patchServer(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  const blockRegex = /const cleanForSEO = \(text, truncateLength\) => \{[\s\S]*?\n\};\n?/m;
  if (blockRegex.test(content)) {
    content = content.replace(blockRegex, newCleanForSEO + '\n');
    fs.writeFileSync(filepath, content);
    console.log('Patched', filepath);
  } else {
    console.log('Could not find cleanForSEO block in ' + filepath);
  }
}

patchServer('server.ts');
patchServer('api/index.ts');

const newSmartTruncate = `const smartTruncate = (text: string, max: number) => {
                          if (!text) return "";
                          if (text.length <= max) return text.replace(/\\.{2,}$/, '').trim();
                          
                          let lastPoint = text.substring(0, max).lastIndexOf('.');
                          if (lastPoint > max * 0.7) {
                            return text.substring(0, lastPoint + 1).replace(/\\.{2,}$/, '').trim();
                          }
                          
                          let lastComma = text.substring(0, max).lastIndexOf(',');
                          if (lastComma > max * 0.7) {
                            return text.substring(0, lastComma).replace(/\\.{2,}$/, '').trim();
                          }
                          
                          let lastSpace = text.substring(0, max).lastIndexOf(' ');
                          if (lastSpace > 0) {
                            return text.substring(0, lastSpace).replace(/\\.{2,}$/, '').trim();
                          }
                          
                          return text.substring(0, max).replace(/\\.{2,}$/, '').trim();
                        };`;

function patchAdmin(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  const blockRegex = /const smartTruncate = \(text: string, max: number\) => \{[\s\S]*?\n\s*\};\n?/m;
  if (blockRegex.test(content)) {
    content = content.replace(blockRegex, newSmartTruncate + '\n');
    fs.writeFileSync(filepath, content);
    console.log('Patched', filepath);
  } else {
    console.log('Could not find smartTruncate block in ' + filepath);
  }
}

patchAdmin('src/pages/Admin/Dashboard.tsx');
