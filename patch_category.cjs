const fs = require('fs');
let code = fs.readFileSync('src/pages/Category.tsx', 'utf8');

const oldSub = `<div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-orange-500 transition-colors">
                      {sub.image ? (
                        <img 
                          src={getResizedImageUrl(sub.image, 128)} 
                          alt={sub.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          width="64"
                          height="64"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-2xl">{getCategoryWithEmoji(sub.name).split(' ')[0]}</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-800 text-center text-sm group-hover:text-orange-500 transition-colors">{sub.name}</span>`;

const newSub = `<div className="w-full aspect-video bg-gray-50 flex items-center justify-center overflow-hidden relative">
                      {sub.image ? (
                        <img 
                          src={getResizedImageUrl(sub.image, 400)} 
                          alt={sub.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-4xl">{getCategoryWithEmoji(sub.name).split(' ')[0]}</span>
                      )}
                    </div>
                    <div className="p-3 w-full text-center border-t border-gray-50">
                      <span className="font-medium text-gray-800 text-sm group-hover:text-orange-500 transition-colors line-clamp-1">{sub.name}</span>
                    </div>`;

code = code.replace(oldSub, newSub);

const oldSubSub = `<div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-orange-500 transition-colors">
                      {subsub.image ? (
                        <img 
                          src={getResizedImageUrl(subsub.image, 128)} 
                          alt={subsub.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          width="64"
                          height="64"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-2xl">{getCategoryWithEmoji(subsub.name).split(' ')[0]}</span>
                      )}
                    </div>
                    <span className="font-medium text-gray-800 text-center text-sm group-hover:text-orange-500 transition-colors">{subsub.name}</span>`;

const newSubSub = `<div className="w-full aspect-video bg-gray-50 flex items-center justify-center overflow-hidden relative">
                      {subsub.image ? (
                        <img 
                          src={getResizedImageUrl(subsub.image, 400)} 
                          alt={subsub.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-4xl">{getCategoryWithEmoji(subsub.name).split(' ')[0]}</span>
                      )}
                    </div>
                    <div className="p-3 w-full text-center border-t border-gray-50">
                      <span className="font-medium text-gray-800 text-sm group-hover:text-orange-500 transition-colors line-clamp-1">{subsub.name}</span>
                    </div>`;

code = code.replace(oldSubSub, newSubSub);

// Also need to fix the <Link> classes to remove padding and flex gap
code = code.replace(
  `className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center justify-center gap-3 group"`,
  `className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center justify-center group overflow-hidden"`
);
// replace again if it exists twice
code = code.replace(
  `className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center justify-center gap-3 group"`,
  `className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all flex flex-col items-center justify-center group overflow-hidden"`
);

fs.writeFileSync('src/pages/Category.tsx', code);
console.log('Patched category grids');
