const fs = require('fs');
let code = fs.readFileSync('src/pages/Category.tsx', 'utf8');

const target1 = `          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm mb-6">
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
          </div>`;

const replacement1 = `          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {slug && categorySEOData[slug] ? categorySEOData[slug].h1 : categoryName}
              </h1>
              <span className="text-sm text-gray-500 whitespace-nowrap ml-4">{filteredProducts.length} produits trouvés</span>
            </div>
          </div>`;

const target2 = `            {slug && categorySEOData[slug] && categorySEOData[slug].links && (
              <div className="mt-12 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Continuez votre visite sur ZORANDO :</h3>`;

const replacement2 = `            {slug && categorySEOData[slug] && (
              <div className="mt-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="prose prose-sm text-gray-600 max-w-none">
                  {categorySEOData[slug].intro.split('\\n\\n').map((paragraph, idx) => {
                    const boldMatch = paragraph.match(/^\\*\\*(.*?)\\*\\*(.*)/);
                    if (boldMatch) {
                      return <p key={idx} className="mb-2"><strong className="text-gray-800">{boldMatch[1]}</strong>{boldMatch[2]}</p>;
                    }
                    return <p key={idx} className="mb-2">{paragraph}</p>;
                  })}
                </div>
              </div>
            )}
            {slug && categorySEOData[slug] && categorySEOData[slug].links && (
              <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Continuez votre visite sur ZORANDO :</h3>`;

if (!code.includes(target1)) {
  console.log('TARGET 1 NOT FOUND');
} else if (!code.includes(target2)) {
  console.log('TARGET 2 NOT FOUND');
} else {
  code = code.replace(target1, replacement1);
  code = code.replace(target2, replacement2);
  fs.writeFileSync('src/pages/Category.tsx', code);
  console.log('SUCCESS');
}
