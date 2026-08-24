const fs = require('fs');

let apiIndex = fs.readFileSync('api/index.ts', 'utf8');
apiIndex = apiIndex.replace(
  /"name": product\.name\s+\}\);/g,
  '"name": product.name,\n                "item": `${baseUrl}${req.path}`\n             });'
);
fs.writeFileSync('api/index.ts', apiIndex);

let serverTs = fs.readFileSync('server.ts', 'utf8');
serverTs = serverTs.replace(
  /"name": product\.name\s+\}\);/g,
  '"name": product.name,\n                "item": `${baseUrl}${req.path}`\n             });'
);
fs.writeFileSync('server.ts', serverTs);

console.log('Fixed item error');
