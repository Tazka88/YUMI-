const fs = require('fs');

let content = fs.readFileSync('src/pages/Category.tsx', 'utf8');

content = content.replace(
  "import { fetchWithCache } from '../lib/utils';",
  "import { fetchWithCache } from '../lib/utils';\nimport { categorySEOData } from '../utils/seoData';"
);

content = content.replace(
  /<SEO \s*title=\{categoryName\} \s*description=\{`Découvrez notre sélection de produits dans la catégorie \$\{categoryName\}\. Achetez au meilleur prix sur ZORANDO\.`\} \s*url=\{window\.location\.href\}\s*\/>/m,
  `<SEO 
        title={slug && categorySEOData[slug] ? categorySEOData[slug].title : categoryName} 
        exactTitle={!!(slug && categorySEOData[slug])}
        description={slug && categorySEOData[slug] ? categorySEOData[slug].description : \`Découvrez notre sélection de produits dans la catégorie \${categoryName}. Achetez au meilleur prix sur ZORANDO.\`} 
        url={window.location.href}
      />`
);

content = content.replace(
  /<div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex justify-between items-center">\s*<h1 className="text-xl font-bold text-gray-800">\{categoryName\}<\/h1>\s*<span className="text-sm text-gray-500">\{filteredProducts\.length\} produits trouvés<\/span>\s*<\/div>/m,
  `<div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {slug && categorySEOData[slug] ? categorySEOData[slug].h1 : categoryName}
              </h1>
              <span className="text-sm text-gray-500 whitespace-nowrap ml-4 mt-1">{filteredProducts.length} produits trouvés</span>
            </div>
            {slug && categorySEOData[slug] && (
              <div className="prose prose-sm text-gray-600 max-w-none">
                {categorySEOData[slug].intro.split('\\n\\n').map((paragraph, idx) => {
                  const boldMatch = paragraph.match(/^\\*\\*(.*?)\\*\\*(.*)/);
                  if (boldMatch) {
                    return <p key={idx} className="mb-2"><strong className="text-gray-800">{boldMatch[1]}</strong>{boldMatch[2]}</p>;
                  }
                  return <p key={idx} className="mb-2">{paragraph}</p>;
                })}
              </div>
            )}
          </div>`
);

content = content.replace(
  /<\/div>\s*\)\s*:\s*\(\s*<div className="bg-white p-8 rounded-lg shadow-sm text-center">/m,
  `</div>
            {slug && categorySEOData[slug] && categorySEOData[slug].links && (
              <div className="mt-12 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Continuez votre visite sur ZORANDO :</h3>
                <ul className="space-y-3">
                  {categorySEOData[slug].links.map((link, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <Link to={link.url} className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">`
);


fs.writeFileSync('src/pages/Category.tsx', content);
