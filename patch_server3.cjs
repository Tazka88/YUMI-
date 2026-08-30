const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCode = `    const getStarIndex = app._router.stack.findIndex(layer => layer.route && layer.route.path === '*');
    if (getStarIndex !== -1) {
      app._router.stack.splice(getStarIndex, 0, {
        handle: vite.middlewares,
        name: 'vite',
        params: undefined,
        path: '',
        keys: [],
        regexp: /.*/,
        method: undefined
      });
    } else {`;

const newCode = `    const getStarIndex = app._router.stack.findIndex(layer => layer.route && layer.route.path === '*');
    if (getStarIndex !== -1) {
      const starLayer = app._router.stack.splice(getStarIndex, 1)[0];
      app.use(vite.middlewares);
      app._router.stack.push(starLayer);
    } else {`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('server.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Failed to find oldCode");
}
