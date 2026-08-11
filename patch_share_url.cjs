const fs = require('fs');
let code = fs.readFileSync('src/pages/Blog/BlogPost.tsx', 'utf8');

code = code.replace(
  "const shareUrl = typeof window !== 'undefined' ? window.location.href : '';",
  "const shareUrl = typeof window !== 'undefined' ? window.location.href.replace(/^https?:\\/\\/(www\\.)?[^\\/]+/, 'https://www.zorando.com') : '';"
);

fs.writeFileSync('src/pages/Blog/BlogPost.tsx', code);
