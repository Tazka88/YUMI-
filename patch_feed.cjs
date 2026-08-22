const fs = require('fs');

const routeCode = `
router.get('/merchant-feed.xml', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=7200');
  
  const cacheKey = 'merchant_feed_xml';
  const cached = getCache(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(Buffer.from(cached));
  }

  try {
    const MERCHANT_PRODUCT_COLS = "p.id, p.sku, p.name, p.slug, p.description, p.seo_description, p.price, p.promo_price, p.stock, p.is_active, p.image";
    const products = await sql\`
      SELECT \${sql.unsafe(MERCHANT_PRODUCT_COLS)}, COALESCE(p.brand_name, b.name) as brand_name, c.name as category_name
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    \`;

    // Filter valid products
    const activeProducts = products.filter((p) => p.image && typeof p.image === 'string' && p.image.trim() !== '');

    const baseUrl = 'https://www.zorando.com';
    
    // XML Header
    let xml = \`<?xml version="1.0" encoding="UTF-8"?>\\n\`;
    xml += \`<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\\n\`;
    xml += \`<channel>\\n\`;
    xml += \`  <title>ZORANDO Merchant Feed</title>\\n\`;
    xml += \`  <link>\${baseUrl}</link>\\n\`;
    xml += \`  <description>Flux des produits ZORANDO pour Google Merchant Center</description>\\n\`;

    // Helper to escape XML special chars
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return String(unsafe).replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    activeProducts.forEach((p) => {
      const id = escapeXml(p.sku || String(p.id));
      const title = escapeXml(String(p.name).substring(0, 150));
      
      let rawDesc = p.seo_description || p.description || p.name || '';
      let descriptionText = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().substring(0, 5000);
      const description = escapeXml(descriptionText);
      
      const availability = p.stock > 0 ? 'in_stock' : 'out_of_stock';
      const condition = 'new';
      
      const priceVal = p.promo_price > 0 ? p.promo_price : p.price;
      const price = \`\${Number(priceVal).toFixed(2)} DZD\`;
      
      const link = escapeXml(\`\${baseUrl}/product/\${p.slug}\`);
      
      const vMatch = p.image.match(/(\\?v=[^&]+)/);
      const vParam = vMatch ? vMatch[1] : '';
      const seoSlug = p.slug ? \`/\${p.slug}.webp\` : '';
      let image_link = \`\${baseUrl}/api/images/products/\${p.id}/image\${seoSlug}\${vParam}\`;
      if (p.image.startsWith('http')) {
        image_link = p.image;
      }
      image_link = escapeXml(image_link);
      
      const brand = escapeXml(p.brand_name || 'Zorando');
      const category = escapeXml(p.category_name || 'Divers');

      xml += \`  <item>\\n\`;
      xml += \`    <g:id>\${id}</g:id>\\n\`;
      xml += \`    <g:title>\${title}</g:title>\\n\`;
      xml += \`    <g:description>\${description}</g:description>\\n\`;
      xml += \`    <g:link>\${link}</g:link>\\n\`;
      xml += \`    <g:image_link>\${image_link}</g:image_link>\\n\`;
      xml += \`    <g:price>\${price}</g:price>\\n\`;
      xml += \`    <g:availability>\${availability}</g:availability>\\n\`;
      xml += \`    <g:brand>\${brand}</g:brand>\\n\`;
      xml += \`    <g:condition>\${condition}</g:condition>\\n\`;
      xml += \`    <g:google_product_category>\${category}</g:google_product_category>\\n\`;
      xml += \`  </item>\\n\`;
    });

    xml += \`</channel>\\n\`;
    xml += \`</rss>\`;

    setCache(cacheKey, xml, 60);
    
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Failed to export merchant feed:', err);
    res.status(500).json({ error: 'Failed to export merchant feed' });
  }
});
`;

let content = fs.readFileSync('src/api/routes.ts', 'utf8');

// Insert it right after the meta-catalog.csv route
const metaCatalogEnd = "function generateSlug(str: string): string {";
content = content.replace(metaCatalogEnd, routeCode + '\n\n' + metaCatalogEnd);

fs.writeFileSync('src/api/routes.ts', content);
console.log('Patched routes.ts with merchant-feed.xml endpoint');
