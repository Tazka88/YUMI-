const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const navCode = `
        {/* Desktop Categories Navigation */}
        <div className="hidden lg:block bg-white border-t border-gray-100">
          <div className="container mx-auto px-4">
            <ul className="flex items-center gap-8 overflow-x-auto hide-scrollbar py-3">
              {categories.map((cat) => (
                <li key={cat.id} className="whitespace-nowrap group relative">
                  <Link
                    to={\`/category/\${cat.slug}\`}
                    className="text-[13px] font-bold text-gray-700 hover:text-orange-600 transition-colors flex items-center gap-2"
                  >
                    <CategoryNameDisplay name={cat.name} />
                  </Link>
                  {/* Optional Dropdown for Subcategories could go here */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                     <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-3">
                        <ul className="space-y-2">
                           {cat.subcategories.map(sub => (
                              <li key={sub.id}>
                                <Link to={\`/category/\${sub.slug}?sub=true\`} className="text-sm text-gray-600 hover:text-orange-500 font-medium flex items-center gap-2">
                                  <ChevronRight size={14} className="text-gray-400" />
                                  <CategoryNameDisplay name={sub.name} />
                                </Link>
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>
`;

code = code.replace('      </header>', navCode);

fs.writeFileSync('src/components/Layout.tsx', code);
console.log('Patched Layout.tsx');
