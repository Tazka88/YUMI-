const postgres = require('postgres');
const { buildProductSchema, buildBreadcrumbSchema } = require('./dist/server.cjs'); // Wait, buildProductSchema is not exported from server.cjs

