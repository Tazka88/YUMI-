const fs = require('fs');

let content = fs.readFileSync('src/pages/Category.tsx', 'utf8');

content = content.replace(
  /<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">\s*\{filteredProducts\.map\(\(p, i\) => <ProductCard key=\{p\.id\} product=\{p\} priority=\{i < 4\} \/>\)\}\s*<\/div>/m,
  `<>\n              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">\n                {filteredProducts.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}\n              </div>`
);

content = content.replace(
  /<\/ul>\s*<\/div>\s*\)\}\s*\)\s*:\s*\(/m,
  `</ul>\n              </div>\n            )}\n            </>\n          ) : (`
);

fs.writeFileSync('src/pages/Category.tsx', content);
