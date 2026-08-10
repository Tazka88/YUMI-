const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin/Dashboard.tsx', 'utf8');
code = code.replace(
  `                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix Promo (DA)</label>
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price} onChange={e => setProductForm({...productForm, promo_price: e.target.value})} />
                </div>`,
  `                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix Promo (DA)</label>
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price} onChange={e => setProductForm({...productForm, promo_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Début promo (Optionnel)</label>
                  <input type="datetime-local" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price_start_date} onChange={e => setProductForm({...productForm, promo_price_start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fin promo (Optionnel, SEO)</label>
                  <input type="datetime-local" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price_end_date} onChange={e => setProductForm({...productForm, promo_price_end_date: e.target.value})} />
                </div>`
);
fs.writeFileSync('src/pages/Admin/Dashboard.tsx', code);
