import fs from 'fs';
const path = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<h4 className="font-bold text-gray-900 uppercase">{office.name}</h4>',
  '<h4 className="font-bold text-gray-900 uppercase">{office.name}</h4>\n                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${office.company === "ecomdz" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{office.company === "ecomdz" ? "Ecom-DZ" : "DHD"}</span>'
);

fs.writeFileSync(path, content);
