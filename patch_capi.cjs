const fs = require('fs');

let routes = fs.readFileSync('src/api/routes.ts', 'utf8');
routes = routes.replace("router.use('/app-events/v1', capiRoutes);", "router.use('/metrics/v1', capiRoutes);");
fs.writeFileSync('src/api/routes.ts', routes);

let libCapi = fs.readFileSync('src/lib/capi.ts', 'utf8');
libCapi = libCapi.replace("fetch('/api/app-events/v1'", "fetch('/api/metrics/v1'");
fs.writeFileSync('src/lib/capi.ts', libCapi);
console.log("Renamed route");
