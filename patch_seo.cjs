const fs = require('fs');

const oldCode = `  if (truncateLength && cleaned.length > truncateLength) {
    const truncated = cleaned.substring(0, truncateLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }`;

const newCode = `  if (truncateLength && cleaned.length > truncateLength) {
    const truncated = cleaned.substring(0, truncateLength);
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > 0) {
      return truncated.substring(0, lastPeriod + 1);
    }
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
  }`;

function patch(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filepath, content);
  console.log('patched ' + filepath);
}

patch('server.ts');
patch('api/index.ts');
