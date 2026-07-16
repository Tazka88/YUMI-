import fs from 'fs';
const path = 'src/api/routes.ts';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace("import ecomdzRoutes from './ecomdz.js';", "import ecomdzRoutes, { fetchEcomdzStopdesks } from './ecomdz.js';");

const newRoute = `
router.get('/all-stopdesks', async (req, res) => {
  const cacheKey = 'all_stopdesks_merged';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400');
  try {
    // 1. DHD offices (from local DB as existing)
    const dhdOffices = await sql\`SELECT * FROM offices ORDER BY wilaya ASC, name ASC\`;
    
    // 2. Ecom-DZ offices
    const ecomdzData = await fetchEcomdzStopdesks();
    
    const mergedOffices = [];
    
    if (dhdOffices && Array.isArray(dhdOffices)) {
      dhdOffices.forEach((o: any) => {
        mergedOffices.push({
          id: \`dhd-\${o.id}\`,
          original_id: o.id,
          company: 'dhd',
          name: o.name,
          address: o.address,
          wilaya: o.wilaya,
          commune: o.commune,
          phone: o.phone
        });
      });
    }

    if (ecomdzData && ecomdzData.Commune && Array.isArray(ecomdzData.Commune)) {
      ecomdzData.Commune.forEach((o: any) => {
        mergedOffices.push({
          id: \`ecomdz-\${o.Code}\`,
          original_id: o.Code, // CodeStopdesk
          company: 'ecomdz',
          name: o.Libelle,
          address: o.Adresse,
          wilaya: o.Ville,
          commune: o.Commune,
          phone: ''
        });
      });
    }

    // Cache for 24 hours (86400 seconds)
    setCache(cacheKey, mergedOffices, 86400);
    res.json(mergedOffices);
  } catch (err) {
    console.error('Failed to fetch merged stopdesks:', err);
    res.status(500).json({ error: 'Failed to fetch merged stopdesks' });
  }
});
`;

content = content.replace("router.get('/offices', async (req, res) => {", newRoute + "\nrouter.get('/offices', async (req, res) => {");

fs.writeFileSync(path, content);
