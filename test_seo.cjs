const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

const regex = /if \(req\.path === '\/' \|\| req\.path === '\/index\.html'\) \{([\s\S]*?)const globalNav = `/;
const match = serverCode.match(regex);
if (match) {
  console.log("Matched SSR routing logic. Length:", match[1].length);
} else {
  console.log("No match");
}
