import fs from 'fs';
const path = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(path, 'utf8');

const companySelection = `
            {deliveryMode === 'domicile' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Société de livraison (Domicile) *</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={\`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center transition-colors \${homeDeliveryCompany === 'dhd' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}\`}>
                    <input type="radio" className="sr-only" name="homeDeliveryCompany" value="dhd" checked={homeDeliveryCompany === 'dhd'} onChange={() => setHomeDeliveryCompany('dhd')} />
                    <span className={\`font-semibold \${homeDeliveryCompany === 'dhd' ? 'text-orange-700' : 'text-gray-700'}\`}>DHD</span>
                  </label>
                  <label className={\`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center transition-colors \${homeDeliveryCompany === 'ecomdz' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}\`}>
                    <input type="radio" className="sr-only" name="homeDeliveryCompany" value="ecomdz" checked={homeDeliveryCompany === 'ecomdz'} onChange={() => setHomeDeliveryCompany('ecomdz')} />
                    <span className={\`font-semibold \${homeDeliveryCompany === 'ecomdz' ? 'text-blue-700' : 'text-gray-700'}\`}>Ecom-DZ</span>
                  </label>
                </div>
              </div>
            )}
`;

content = content.replace(
  "{deliveryMode === 'bureau' && (",
  companySelection + "\n            {deliveryMode === 'bureau' && ("
);

fs.writeFileSync(path, content);
