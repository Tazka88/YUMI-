const fs = require('fs');

function parseHeaders(file) {
  try {
    const html = fs.readFileSync(file, 'utf-8');
    const h1Match = html.match(/<h1[^>]*>.*?<\/h1>/gi) || [];
    const h2Match = html.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
    const h3Match = html.match(/<h3[^>]*>.*?<\/h3>/gi) || [];
    console.log(`\n--- ${file} ---`);
    console.log('H1:', h1Match.length);
    h1Match.forEach(h => console.log('  ' + h));
    console.log('H2:', h2Match.length);
    h2Match.forEach(h => console.log('  ' + h.substring(0, 100) + '...'));
  } catch(e) {
    console.log(`Error reading ${file}`);
  }
}

parseHeaders(process.argv[2]);
