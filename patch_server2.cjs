const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace export default app;
code = code.replace("export default app;", `
async function startServer() {
  const PORT = process.env.PORT || 3000;
  
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Add vite middleware right before the SEO wildcard handler
    const getStarIndex = app._router.stack.findIndex(layer => layer.route && layer.route.path === '*');
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
    } else {
      app.use(vite.middlewares);
    }
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`);

fs.writeFileSync('server.ts', code);
