const fs = require('fs');

let routes = fs.readFileSync('src/api/routes.ts', 'utf8');
routes = routes.replace("router.use('/metrics/v1', capiRoutes);", "router.use('/ui-sync', capiRoutes);");
fs.writeFileSync('src/api/routes.ts', routes);

let libCapi = fs.readFileSync('src/lib/capi.ts', 'utf8');
libCapi = libCapi.replace("fetch('/api/metrics/v1'", "fetch('/api/ui-sync'");
fs.writeFileSync('src/lib/capi.ts', libCapi);
console.log("Renamed route again");
