const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin/Dashboard.tsx', 'utf8');

code = code.replace(
  `if (swrProducts.products) { setProducts(swrProducts.products); setTotalPages(Math.ceil((swrProducts.totalCount || 1) / itemsPerPage)); }`,
  `if (swrProducts.products) { setProducts(swrProducts.products); setTotalPages(Math.ceil((swrProducts.totalCount || swrProducts.total || 1) / itemsPerPage)); }`
);

fs.writeFileSync('src/pages/Admin/Dashboard.tsx', code);
console.log('Patched Dashboard.tsx products totalCount');
