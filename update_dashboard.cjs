const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin/Dashboard.tsx', 'utf8');

// Add to productForm state initialization
code = code.replace(
  "price: '', promo_price: '', stock: '', weight: '', description: '', image: '', video_url: '',",
  "price: '', promo_price: '', promo_price_start_date: '', promo_price_end_date: '', stock: '', weight: '', description: '', image: '', video_url: '',"
);

code = code.replace(
  "promo_price: (fullProduct.promo_price !== null && fullProduct.promo_price !== undefined) ? fullProduct.promo_price : '',",
  "promo_price: (fullProduct.promo_price !== null && fullProduct.promo_price !== undefined) ? fullProduct.promo_price : '', \n          promo_price_start_date: fullProduct.promo_price_start_date ? new Date(fullProduct.promo_price_start_date).toISOString().slice(0, 16) : '', \n          promo_price_end_date: fullProduct.promo_price_end_date ? new Date(fullProduct.promo_price_end_date).toISOString().slice(0, 16) : '',"
);

code = code.replace(
  "promo_price: (productForm.promo_price !== '' && productForm.promo_price !== null) ? parseFloat(productForm.promo_price.toString().replace(',', '.')) : null,",
  "promo_price: (productForm.promo_price !== '' && productForm.promo_price !== null) ? parseFloat(productForm.promo_price.toString().replace(',', '.')) : null,\n      promo_price_start_date: productForm.promo_price_start_date || null,\n      promo_price_end_date: productForm.promo_price_end_date || null,"
);

// We need to add the inputs to the UI.
// Let's find where the promo_price input is.
const promoPriceInputHTML = `<input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price} onChange={e => setProductForm({...productForm, promo_price: e.target.value})} />`;

// Let's replace the grid div for price/promo_price/stock/weight, but it might be easier to just inject the new inputs right after the promo price wrapper
code = code.replace(
  `                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix Promo (DZD)</label>
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price} onChange={e => setProductForm({...productForm, promo_price: e.target.value})} />
                </div>`,
  `                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix Promo (DZD)</label>
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price} onChange={e => setProductForm({...productForm, promo_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Début promo (Optionnel)</label>
                  <input type="datetime-local" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price_start_date} onChange={e => setProductForm({...productForm, promo_price_start_date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin promo (Optionnel, SEO)</label>
                  <input type="datetime-local" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price_end_date} onChange={e => setProductForm({...productForm, promo_price_end_date: e.target.value})} />
                </div>`
);

fs.writeFileSync('src/pages/Admin/Dashboard.tsx', code);
