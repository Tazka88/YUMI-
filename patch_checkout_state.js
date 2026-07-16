import fs from 'fs';
const path = 'src/pages/Checkout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace /api/offices with /api/all-stopdesks
content = content.replace("const officesData = await fetchWithCache('/api/offices');", "const officesData = await fetchWithCache('/api/all-stopdesks');");

content = content.replace("const [deliveryMode, setDeliveryMode] = useState<'domicile' | 'bureau'>('domicile');", "const [deliveryMode, setDeliveryMode] = useState<'domicile' | 'bureau'>('domicile');\n  const [homeDeliveryCompany, setHomeDeliveryCompany] = useState<'dhd' | 'ecomdz'>('dhd');");

fs.writeFileSync(path, content);
