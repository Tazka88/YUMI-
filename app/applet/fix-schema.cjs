const fs = require('fs');
let s = fs.readFileSync('src/db/schema.sql', 'utf8');

const lines = s.split('\n');
const out = [];

for (const line of lines) {
  const m = line.match(/^CREATE POLICY "([^"]+)" ON (\w+) FOR .*/);
  if (m) {
    const policyName = m[1];
    const tableName = m[2];
    out.push(`DROP POLICY IF EXISTS "${policyName}" ON ${tableName};`);
  }
  out.push(line);
}

fs.writeFileSync('src/db/schema.sql', out.join('\n'));
console.log('Fixed schema.sql');
