const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const oldNav = `        {/* Desktop Categories Navigation */}
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
      </header>`;

const newNav = `        {/* Desktop Categories Navigation (Mega Menu) */}
        <div className="hidden lg:block bg-white border-t border-gray-100 relative group/nav">
          <div className="container mx-auto px-4">
            <ul className="flex items-center flex-wrap gap-x-8 gap-y-2 py-2">
              {categories.map((cat) => (
                <li key={cat.id} className="group static">
                  <Link
                    to={\`/category/\${cat.slug}\`}
                    className="text-[14px] font-bold text-gray-700 group-hover:text-orange-600 transition-colors flex items-center gap-2 py-2"
                  >
                    <CategoryNameDisplay name={cat.name} />
                  </Link>
                  
                  {/* Premium Mega Menu Dropdown */}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0 z-50">
                      <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                          {cat.subcategories.map((sub: any) => (
                            <div key={sub.id} className="flex flex-col">
                              <Link 
                                to={\`/category/\${sub.slug}?sub=true\`} 
                                className="font-bold text-gray-900 mb-3 hover:text-orange-600 transition-colors border-b border-gray-100 pb-2 flex items-center gap-1"
                              >
                                <CategoryNameDisplay name={sub.name} />
                                <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              {sub.sub_subcategories && sub.sub_subcategories.length > 0 && (
                                <ul className="space-y-2.5">
                                  {sub.sub_subcategories.map((subsub: any) => (
                                    <li key={subsub.id}>
                                      <Link 
                                        to={\`/category/\${subsub.slug}?subsub=true\`}
                                        className="text-[13px] text-gray-500 hover:text-orange-500 transition-colors block"
                                      >
                                        <CategoryNameDisplay name={subsub.name} />
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>`;

code = code.replace(oldNav, newNav);
fs.writeFileSync('src/components/Layout.tsx', code);
console.log('Patched Mega Menu');
