// Script to check if product data leaks between SSR renders
const fs = require('fs');
// Let's check how many product pages use the same cache incorrectly?
// Wait, the cache is per slug:
// `const cacheKey = \`product_\${req.params.slug}\`;`
// `const cached = getCache(cacheKey);`

console.log("Cache key looks safe: product_${req.params.slug}");
