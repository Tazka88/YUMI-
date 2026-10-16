import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './src/api/routes.js';
import path from 'path';
import fs from 'fs';
import { sql } from './src/db/setup.js';
import { categorySEOData } from './src/utils/seoData.js';
import { buildProductSchema, buildBreadcrumbSchema, buildBlogSchema } from './src/lib/schemaUtils.js';

const app = express();
let vite: any = null;

app.set('trust proxy', 1);

// Create uploads directory if it doesn't exist (ephemeral on Vercel)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL;
const uploadsDir = isVercel 
  ? path.join('/tmp', 'uploads') 
  : path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// app.use(compression()); // Removed to prevent double-compression in Vercel
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir, { maxAge: '1y' }));

// API Routes
app.get(['/sitemap.xml', '/api/sitemap.xml'], (req, res, next) => {
  req.url = '/sitemap.xml';
  apiRoutes(req, res, next);
});

app.get(['/robots.txt', '/api/robots.txt'], (req, res, next) => {
  req.url = '/robots.txt';
  apiRoutes(req, res, next);
});

app.use('/api', apiRoutes);

// SEO Routes (passed to apiRoutes)
app.use((req, res, next) => {
  if (req.query.seo === 'sitemap') {
    req.url = '/sitemap.xml';
    return apiRoutes(req, res, next);
  }
  
  if (req.query.seo === 'robots') {
    req.url = '/robots.txt';
    return apiRoutes(req, res, next);
  }
  
// If it's just /api and no other route matched, return 404 JSON instead of HTML
  if (req.url === '/api' || req.path === '/api' || req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found API endpoint' });
  }
  
  next();
});

// Numeric Category redirect for old indexed IDs
app.use(async (req, res, next) => {
  // Dynamic redirects for numeric category IDs
  if (req.path.match(/^\/category\/\d+$/)) {
    const id = parseInt(req.path.split('/')[2]);
    try {
      let [cat] = await sql`SELECT slug FROM categories WHERE id = ${id}`;
      if (cat && cat.slug) return res.redirect(301, `/category/${cat.slug}`);

      let [subcat] = await sql`SELECT slug FROM subcategories WHERE id = ${id}`;
      if (subcat && subcat.slug) return res.redirect(301, `/category/${subcat.slug}?sub=true`);

      let [subsub] = await sql`SELECT slug FROM sub_subcategories WHERE id = ${id}`;
      if (subsub && subsub.slug) return res.redirect(301, `/category/${subsub.slug}?subsub=true`);
    } catch (err) {
      console.error('Error resolving numeric category ID:', err);
    }
  }
  next();
});

// Serve frontend with SEO injection for non-asset routes
const cleanForSEO = (text: any, truncateLength?: number) => {
  if (!text) return '';
  const maxLength = truncateLength || 155;
  let cleanText = text.replace(/<[^>]+>/g, ' ')
                    .replace(/(?:\*\*|\*|__|_|#|>|`|~)/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
  
  if (cleanText.length > maxLength) {
    let lastPoint = cleanText.substring(0, maxLength).lastIndexOf('.');
    if (lastPoint > maxLength * 0.7) {
      return cleanText.substring(0, lastPoint + 1).replace(/\.{2,}$/, '').trim();
    }
    
    let lastComma = cleanText.substring(0, maxLength).lastIndexOf(',');
    if (lastComma > maxLength * 0.7) {
      return cleanText.substring(0, lastComma).replace(/\.{2,}$/, '').trim();
    }
    
    let lastSpace = cleanText.substring(0, maxLength).lastIndexOf(' ');
    if (lastSpace > 0) {
      return cleanText.substring(0, lastSpace).replace(/\.{2,}$/, '').trim();
    }
    
    return cleanText.substring(0, maxLength).replace(/\.{2,}$/, '').trim();
  }
  
  return cleanText.replace(/\.{2,}$/, '').trim();
};

  
  const staticRedirects: Record<string, string> = {
    '/product/hoco-casque-sans-w45': '/product/hoco-casque-sans-fil-bluetooth-5-3-400mah-w45',
    '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-cran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque': '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque',
    '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-172-pouces-bt54-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque': '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque',
    '/brands/bestway': '/brands/piscines-bestway-algerie',
    '/brands/hoco': '/brands/accessoires-hoco-algerie',
    '/brands/kemei': '/brands/tondeuses-kemei-algerie',
    '/brands/moulinex': '/brands/electromenager-moulinex-algerie',
    '/brands/philips': '/brands/electromenager-philips-algerie',
    '/brands/robuste': '/brands/electromenager-robuste-algerie',
    '/brands/sonashi': '/brands/electromenager-sonashi-algerie',
    '/brands/anker': '/brands/accessoires-anker-algerie',
    '/brands/enzo': '/brands/coiffure-enzo-algerie',
    '/brands/karcher': '/brands/nettoyage-karcher-algerie',
    '/blog/hoco-power-bank-en-algerie-guide-complet-prix-et-avis-2026': '/blog'
  };

  app.use((req, res, next) => {
    const newUrl = staticRedirects[req.path];
    if (newUrl) {
      const qs = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      return res.redirect(301, newUrl + qs);
    }
    next();
  });

app.get('*', async (req, res, next) => {
  // If it looks like a static file request (has extension dot), let it fall through
  if (req.path.match(/\.[a-zA-Z0-9]+$/) && !req.path.endsWith('.html')) {
    return next();
  }

  try {
    // Use string literals to help Vercel NFT trace dependencies
    const indexPath = path.join(process.cwd(), 'dist', 'template.html');
    const rootPath = path.join(process.cwd(), 'index.html');
    const publicPath = path.join(process.cwd(), 'public', 'index.html');
    let template = '';
    
    if (process.env.NODE_ENV === 'production' && fs.existsSync(indexPath)) {
      template = fs.readFileSync(indexPath, 'utf-8');
    } else if (fs.existsSync(rootPath)) {
      template = fs.readFileSync(rootPath, 'utf-8');
      if (vite) {
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }
    } else if (fs.existsSync(indexPath)) {
      template = fs.readFileSync(indexPath, 'utf-8');
    } else if (fs.existsSync(publicPath)) {
      template = fs.readFileSync(publicPath, 'utf-8');
    } else {
      template = '<html><head></head><body><h1>Missing template.html</h1></body></html>';
    }

    let title = 'ZORANDO - Boutique en ligne';
    let description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix.';
    let keywords = 'boutique en ligne, e-commerce, Algérie, achat en ligne, électroménager, mode, beauté, maison, ZORANDO';
    const baseUrl = 'https://www.zorando.com';
    let headHtml = `<link rel="canonical" href="${baseUrl}${req.path}" />\n<link rel="preload" as="font" href="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2" type="font/woff2" crossorigin="anonymous">`;
    let seoHtml = '';
    let isNotFound = false;
    let ogImage = `${baseUrl}/og-image-fb.jpg`;
    let ogUrl = `${baseUrl}${req.path}`;

        if (req.path === '/' || req.path === '/index.html') {
      title = 'ZORANDO - Boutique en ligne en Algérie';
      description = 'Découvrez ZORANDO, votre boutique en ligne de confiance en Algérie. Achetez des produits de qualité au meilleur prix. Livraison 58 wilayas.';
      try {
        const categories = await sql`SELECT name, slug FROM categories ORDER BY name ASC`;
        const brands = await sql`SELECT name, slug FROM brands ORDER BY name ASC`;
        let desktopImage = '';
        const [hero] = await sql`SELECT image_url FROM slider_images WHERE is_active = true AND category_id IS NULL ORDER BY position ASC, id ASC LIMIT 1`;
        if (hero && hero.image_url) {
          desktopImage = hero.image_url.startsWith('/') ? `${baseUrl}${hero.image_url}` : `${baseUrl}/${hero.image_url}`;
          ogImage = desktopImage;
          if (desktopImage) {
            headHtml += `
          <link rel="preload" as="image" href="${desktopImage}" media="(min-width: 768px)" fetchpriority="high">`;
          }
        }
        seoHtml = `
          <div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700">
            <h1>ZORANDO - Boutique en ligne en Algérie</h1>
            <p>${description}</p>
            <h2>Nos Catégories</h2>
            <ul>${categories.map((c: any) => `<li><a href="/category/${c.slug}">${c.name}</a></li>`).join('')}</ul>
            <h2>Nos Marques</h2>
            <ul>${brands.map((b: any) => `<li><a href="/brands/${b.slug}">${b.name}</a></li>`).join('')}</ul>
          </div>
        `;
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/brands') {
      title = 'Toutes nos marques | Zorando';
      try {
        const brands = await sql`SELECT name, slug FROM brands ORDER BY name ASC`;
        seoHtml = `
          <div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700">
            <h1>${title}</h1>
            <p>Découvrez toutes les marques partenaires de Zorando.</p>
            <ul>${brands.map((b: any) => `<li><a href="/brands/${b.slug}">${b.name}</a></li>`).join('')}</ul>
          </div>
        `;
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path.startsWith('/brands/')) {
      const parts = req.path.split('/');
      const slug = parts[2];
      const categorySlug = parts[3];
      console.log('SSR BRAND CAT:', slug, categorySlug); 

      if (categorySlug) {
        try {
          const [brand] = await sql`SELECT id, name, slug FROM brands WHERE slug = ${slug}`;
          
          let cat = null;
          let catLevel = '';
          const [category] = await sql`SELECT id, name, slug FROM categories WHERE slug = ${categorySlug}`;
          if (category) { cat = category; catLevel = 'category_id'; }
          else {
            const [subcat] = await sql`SELECT id, name, slug FROM subcategories WHERE slug = ${categorySlug}`;
            if (subcat) { cat = subcat; catLevel = 'subcategory_id'; }
            else {
              const [subsubcat] = await sql`SELECT id, name, slug FROM sub_subcategories WHERE slug = ${categorySlug}`;
              if (subsubcat) { cat = subsubcat; catLevel = 'sub_subcategory_id'; }
            }
          }
          
          if (brand && cat) {
            const catName = cat.name;
            title = `${catName} ${brand.name} en Algérie | Prix & Achat | ZORANDO`;
            description = `Découvrez la gamme de ${catName.toLowerCase()} ${brand.name} disponibles chez ZORANDO. Prix compétitifs, livraison dans les 58 wilayas et paiement à la livraison.`;
            ogUrl = `${baseUrl}${req.path}`;
            
            const products = catLevel === 'category_id' 
              ? await sql`SELECT p.name, p.slug, p.price, p.promo_price, p.stock, p.sku, CASE WHEN p.image LIKE 'data:image/%' THEN '' ELSE p.image END as image FROM products p WHERE p.brand_id = ${brand.id} AND p.category_id = ${cat.id} AND p.is_active = true LIMIT 50`
              : catLevel === 'subcategory_id' 
              ? await sql`SELECT p.name, p.slug, p.price, p.promo_price, p.stock, p.sku, CASE WHEN p.image LIKE 'data:image/%' THEN '' ELSE p.image END as image FROM products p WHERE p.brand_id = ${brand.id} AND p.subcategory_id = ${cat.id} AND p.is_active = true LIMIT 50`
              : await sql`SELECT p.name, p.slug, p.price, p.promo_price, p.stock, p.sku, CASE WHEN p.image LIKE 'data:image/%' THEN '' ELSE p.image END as image FROM products p WHERE p.brand_id = ${brand.id} AND p.sub_subcategory_id = ${cat.id} AND p.is_active = true LIMIT 50`;
            
            let productsHtml = products.map((p: any) => `
              <div>
                <h3><a href="/product/${p.slug}">${p.name}</a></h3>
                <p>Prix : ${p.promo_price || p.price} DZD</p>
                ${p.stock > 0 ? '<p>En stock</p>' : '<p>Rupture de stock</p>'}
              </div>
            `).join('');

            const breadcrumbJson = {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${baseUrl}/` },
                { "@type": "ListItem", "position": 2, "name": "Marques", "item": `${baseUrl}/brands` },
                { "@type": "ListItem", "position": 3, "name": brand.name, "item": `${baseUrl}/brands/${slug}` },
                { "@type": "ListItem", "position": 4, "name": cat.name, "item": `${baseUrl}${req.path}` }
              ]
            };

            const itemListJson = {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": `${catName} ${brand.name} en Algérie`,
              "numberOfItems": products.length,
              "itemListElement": products.map((p: any, idx: number) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "url": `${baseUrl}/product/${p.slug}`,
                "name": p.name
              }))
            };

            headHtml += `\n<script type="application/ld+json">${JSON.stringify(breadcrumbJson)}</script>`;
            headHtml += `\n<script type="application/ld+json">${JSON.stringify(itemListJson)}</script>`;

            seoHtml = `
            <div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose prose-sm max-w-none text-gray-700">
              <h1>${catName} ${brand.name} en Algérie</h1>
              <p>Vous recherchez un(e) ${catName.toLowerCase()} ${brand.name} en Algérie ? ZORANDO vous propose une sélection de ${catName.toLowerCase()} ${brand.name} pour répondre à différents besoins et budgets. Retrouvez des modèles variés et performants selon vos attentes.</p>
              <p>Comparez facilement les ${catName.toLowerCase()} ${brand.name} disponibles : caractéristiques, fonctionnalités et spécificités techniques. Chaque fiche produit présente les informations essentielles pour vous aider à choisir le modèle adapté à votre utilisation.</p>
              <p>Commandez votre ${catName.toLowerCase()} ${brand.name} en ligne sur ZORANDO et profitez de prix compétitifs, de la livraison dans les 58 wilayas d'Algérie et du paiement à la livraison.</p>
              
              ${productsHtml}
              
              <h2>Quel(le) ${catName.toLowerCase()} ${brand.name} choisir ?</h2>
              <p>Le choix dépend avant tout de votre utilisation quotidienne. Selon vos besoins spécifiques et votre budget, vous trouverez le modèle idéal parmi notre sélection.</p>
              
              <h2>Les ${catName.toLowerCase()} ${brand.name} disponibles chez ZORANDO</h2>
              <p>Comparer les modèles est essentiel pour trouver le bon équilibre entre performances et prix. Parcourez les fiches produits ci-dessus pour découvrir les détails techniques de chaque modèle.</p>
              
              <h2>FAQ – ${catName} ${brand.name}</h2>
              <h3>Quel est le meilleur choix de ${catName.toLowerCase()} ${brand.name} ?</h3>
              <p>Le meilleur choix dépend de l'utilisation que vous souhaitez en faire. Nous vous recommandons de consulter les caractéristiques détaillées sur chaque fiche produit pour faire un choix éclairé.</p>
              
              <h3>Quel est le prix d'un(e) ${catName.toLowerCase()} ${brand.name} en Algérie ?</h3>
              <p>Le prix varie selon le modèle et ses fonctionnalités. ZORANDO affiche le prix actuel et promotionnel directement sur chaque fiche produit afin de vous permettre de comparer facilement les modèles ${brand.name} disponibles.</p>
              
              <h3>Les ${catName.toLowerCase()} ${brand.name} sont-ils/elles disponibles avec livraison en Algérie ?</h3>
              <p>Oui. Les ${catName.toLowerCase()} ${brand.name} disponibles sur ZORANDO peuvent être commandés en ligne avec livraison à domicile ou en point relais dans les 58 wilayas d'Algérie avec paiement à la livraison.</p>
              
              <h2>Pourquoi acheter un(e) ${catName.toLowerCase()} ${brand.name} chez ZORANDO ?</h2>
              <p>ZORANDO vous permet de comparer plusieurs modèles de ${catName.toLowerCase()} ${brand.name} selon leurs spécificités. Consultez les caractéristiques et le prix de chaque modèle avant de passer commande. La livraison est disponible dans les 58 wilayas d'Algérie avec paiement à la livraison.</p>
            </div>
            `;
          } else {
             isNotFound = true;
          }
        } catch(e) { console.error("DB Error in SSR generic brand cat:", e); }
      } else {
        try {
          const [brand] = await sql`SELECT id, name, description, seo_title, seo_description, h1_title, seo_content, image FROM brands WHERE slug = ${slug}`;
          if (brand) {
            title = brand.seo_title || `${brand.name} en Algérie | Produits & Prix | ZORANDO`;
            description = brand.seo_description ? cleanForSEO(brand.seo_description) : (brand.description ? cleanForSEO(brand.description, 160) : `Découvrez tous les produits de la marque ${brand.name} sur ZORANDO. Prix compétitifs et livraison dans les 58 wilayas.`);
            const products = await sql`SELECT name, slug, price, promo_price, stock FROM products WHERE brand_id = ${brand.id} AND is_active = true LIMIT 100`;
            
            const breadcrumbJson = {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${baseUrl}/` },
                { "@type": "ListItem", "position": 2, "name": "Marques", "item": `${baseUrl}/brands` },
                { "@type": "ListItem", "position": 3, "name": brand.name, "item": `${baseUrl}/brands/${slug}` }
              ]
            };

            const brandJson = {
              "@context": "https://schema.org",
              "@type": "Brand",
              "name": brand.name,
              "url": `${baseUrl}/brands/${slug}`,
              "logo": brand.image || undefined
            };

            const itemListJson = {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": `${brand.name} en Algérie`,
              "numberOfItems": products.length,
              "itemListElement": products.map((p: any, idx: number) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "item": {
                  "@type": "Product",
                  "name": p.name,
                  "url": `${baseUrl}/product/${p.slug}`,
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "DZD",
                    "price": p.promo_price || p.price,
                    "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "seller": {
                      "@type": "Organization",
                      "name": "ZORANDO"
                    }
                  }
                }
              }))
            };

            headHtml += `\n<script type="application/ld+json">${JSON.stringify(breadcrumbJson)}</script>`;
            headHtml += `\n<script type="application/ld+json">${JSON.stringify(brandJson)}</script>`;
            headHtml += `\n<script type="application/ld+json">${JSON.stringify(itemListJson)}</script>`;

            if (slug === 'electromenager-robuste-algerie') {
              const faqJson = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Quels sont les meilleurs appareils électroménagers ROBUSTE en Algérie ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Parmi les appareils ROBUSTE les plus plébiscités en Algérie figurent la machine à café Expresso Roma (15 bars), la friteuse sans huile Airfryer AF10 10L à double résistance et fenêtre tactile, le robot pétrin PRO MAX pour les pâtes traditionnelles, et le nettoyeur de taches vapeur Proclean 4-en-1."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Quel est le prix des appareils ROBUSTE chez ZORANDO en Algérie ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Les prix des produits ROBUSTE débutent dès 3 300 DZD pour les petits appareils (cafetières compactes, batteurs, presse-agrumes) et vont jusqu'à 24 000 - 25 500 DZD pour les modèles professionnels comme l'Airfryer AF10 10L ou le nettoyeur vapeur Proclean. Tous les prix sont affichés en Dinars Algériens (DZD) avec promotions régulières."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Le robot pétrin ROBUSTE est-il adapté pour le pain maison et la Kesra algérienne ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Oui, le robot pétrin Robuste PRO MAX est équipé d'un moteur robuste à transmission renforcée et d'un bol inox grande capacité, spécialement adapté au pétrissage des pâtes lourdes traditionnelles comme la Kesra, le Khobz Dar et les pâtes à pizza."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Les appareils ROBUSTE sont-ils garantis et livrés dans les 58 wilayas ?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Absolument. Tous les produits ROBUSTE commandés sur ZORANDO sont 100% originaux et couverts par une garantie officielle. La livraison est assurée rapidement à domicile ou en point relais dans les 58 wilayas d'Algérie avec paiement à la livraison après inspection de votre colis."
                    }
                  }
                ]
              };
              headHtml += `\n<script type="application/ld+json">${JSON.stringify(faqJson)}</script>`;
            }

            let productsHtml = products.map((p: any) => `
              <li>
                <a href="/product/${p.slug}">${p.name}</a> - ${p.promo_price || p.price} DZD
                ${p.stock > 0 ? '(En stock)' : '(Rupture)'}
              </li>
            `).join('');

            const brandH1 = brand.h1_title || `${brand.name} en Algérie`;
            const brandContent = brand.seo_content || `<p>${description}</p>`;

            let faqSectionHtml = '';
            if (slug === 'electromenager-robuste-algerie') {
              faqSectionHtml = `
              <h2>Foire Aux Questions – Marque ROBUSTE en Algérie</h2>
              <h3>Quels sont les meilleurs appareils électroménagers ROBUSTE en Algérie ?</h3>
              <p>Parmi les appareils ROBUSTE les plus plébiscités en Algérie figurent la machine à café Expresso Roma (15 bars), la friteuse sans huile Airfryer AF10 10L à double résistance et fenêtre tactile, le robot pétrin PRO MAX pour les pâtes traditionnelles, et le nettoyeur de taches vapeur Proclean 4-en-1.</p>
              <h3>Quel est le prix des appareils ROBUSTE chez ZORANDO en Algérie ?</h3>
              <p>Les prix des produits ROBUSTE débutent dès 3 300 DZD pour les petits appareils (cafetières compactes, batteurs, presse-agrumes) et vont jusqu'à 24 000 - 25 500 DZD pour les modèles professionnels comme l'Airfryer AF10 10L ou le nettoyeur vapeur Proclean.</p>
              <h3>Le robot pétrin ROBUSTE est-il adapté pour le pain maison et la Kesra algérienne ?</h3>
              <p>Oui, le robot pétrin Robuste PRO MAX est équipé d'un moteur robuste à transmission renforcée et d'un bol inox grande capacité, spécialement adapté au pétrissage des pâtes lourdes traditionnelles comme la Kesra, le Khobz Dar et les pâtes à pizza.</p>
              <h3>Les appareils ROBUSTE sont-ils garantis et livrés dans les 58 wilayas ?</h3>
              <p>Absolument. Tous les produits ROBUSTE commandés sur ZORANDO sont 100% originaux et couverts par une garantie officielle. La livraison est assurée rapidement à domicile ou en point relais dans les 58 wilayas d'Algérie avec paiement à la livraison.</p>
              `;
            }

            let brandBlogsHtml = '';
            if (slug === 'electromenager-robuste-algerie') {
              brandBlogsHtml = `
              <h2>Guides d'Achat, Tests & Réponses aux Questions Fréquentes ROBUSTE</h2>
              <ul>
                <li><a href="/blog/robot-petrin-robuste-algerie-kesra-khobz-dar-test-avis-prix-2026">Robot Pétrin ROBUSTE en Algérie : Idéal pour Kesra, Khobz Dar et Pâtes Lourdes ? (Test 2026)</a></li>
                <li><a href="/blog/nettoyeur-de-taches-robuste-proclean-4en1-algerie-test-avis-prix-2026">Nettoyeur de Taches ROBUSTE Proclean 4-en-1 en Algérie : Test sur Canapés, Tapis et Matelas (2026)</a></li>
                <li><a href="/blog/electromenager-robuste-algerie-guide-prix-dzd-garantie-avis-2026">Électroménager ROBUSTE en Algérie 2026 : Prix en DZD, Garantie & Avis Clients</a></li>
                <li><a href="/blog/air-fryer-robuste-algerie-comparatif-af10-10l-8l-avis-prix-2026">Air Fryer ROBUSTE : Comparatif AF10 10L vs 8L (Avis, Test & Prix DZD)</a></li>
                <li><a href="/blog/machine-a-cafe-robuste-algerie-expresso-roma-auto-italia-avis-prix-2026">Machine à Café ROBUSTE : Expresso Roma vs Auto Italia (Guide & Prix 2026)</a></li>
              </ul>
              `;
            } else if (slug === 'electromenager-sonashi-algerie') {
              brandBlogsHtml = `
              <h2>Guides d'Achat, Tests & Réponses aux Questions Fréquentes SONASHI</h2>
              <ul>
                <li><a href="/blog/air-fryer-sonashi-saf-642g-double-bac-verre-avis-test-prix-algerie-2026">Air Fryer Sonashi SAF-642G (Double Bac Verre 10,2L) : Avis, Test & Prix en Algérie (2026)</a></li>
                <li><a href="/blog/machine-a-cafe-sonashi-scm-4984-3en1-multi-capsules-test-avis-prix-algerie-2026">Machine à Café Expresso Sonashi SCM-4984 (3 en 1, 20 Bars) : Test, Compatibilité & Prix (2026)</a></li>
                <li><a href="/blog/electromenager-sonashi-algerie-avis-qualite-prix-catalogue-officiel-2026">Électroménager SONASHI en Algérie (2026) : Avis sur la Qualité, Catalogue Officiel & Prix</a></li>
              </ul>
              `;
            } else if (slug === 'schallenge-electromenager-algerie') {
              brandBlogsHtml = `
              <h2>Guides d'Achat, Tests & Réponses aux Questions Fréquentes SCHALLENGE</h2>
              <ul>
                <li><a href="/blog/air-fryer-schallenge-algerie-comparatif-double-bac-11l-8l-avis-prix-2026">Air Fryer SChallenge en Algérie : Comparatif Double Bac 11L, 8L & 6.5L, Test, Avis & Prix 2026</a></li>
                <li><a href="/blog/machine-a-cafe-schallenge-20-bars-algerie-test-avis-moulu-capsules-prix-2026">Machine à Café SChallenge 20 Bars en Algérie : Test & Avis 2-en-1 Café Moulu & Capsules (Guide 2026)</a></li>
                <li><a href="/blog/panineuse-grill-schallenge-algerie-amb-gt50e-gt57e-gt31-avis-prix-2026">Panineuse & Grill Digital SChallenge 2000W en Algérie : AMB-GT50E vs AMB-GT57E vs AMB-GT31 (Avis & Prix 2026)</a></li>
              </ul>
              `;
            }

            seoHtml = `
            <div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700">
              <h1>${brandH1}</h1>
              ${brandContent}
              ${faqSectionHtml}
              ${brandBlogsHtml}
              <h2>Produits ${brand.name} en Stock chez ZORANDO</h2>
              <ul>${productsHtml}</ul>
            </div>
            `;
          } else {
            isNotFound = true;
          }
        } catch(e) { console.error("DB Error in SSR:", e); }
      }
    } else if (req.path.startsWith('/category/')) {
      const slug = req.path.split('/')[2];
      
      if (slug === 'all') {
        title = 'Tous les produits | ZORANDO';
        description = 'Découvrez tous nos produits sur ZORANDO. Nouveautés, ventes flash et meilleures ventes. Achetez au meilleur prix.';
        seoHtml = `<div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700"><h1>${title}</h1><p>${description}</p></div>`;
      } else if (categorySEOData && categorySEOData[slug]) {
        title = categorySEOData[slug].title;
        description = categorySEOData[slug].description;
        if (categorySEOData[slug].keywords) keywords = categorySEOData[slug].keywords;
        seoHtml = `<div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700"><h1>${title}</h1><p>${description}</p></div>`;
      } else {
        try {
          const [category] = await sql`SELECT id, name FROM categories WHERE slug = ${slug}`;
          let catName = '';
          if (category) {
            catName = category.name;
          } else {
            const [subcat] = await sql`SELECT id, name FROM subcategories WHERE slug = ${slug}`;
            if (subcat) catName = subcat.name;
            else {
              const [subSubcat] = await sql`SELECT id, name FROM sub_subcategories WHERE slug = ${slug}`;
              if (subSubcat) catName = subSubcat.name;
              else isNotFound = true;
            }
          }
          
          if (catName && !isNotFound) {
            title = `${catName} | ZORANDO`;
            description = `Découvrez notre sélection de produits dans la catégorie ${catName}. Achetez au meilleur prix sur ZORANDO.`;
            
            seoHtml = `
            <div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700">
              <h1>${catName}</h1>
              <p>${description}</p>
            </div>
            `;
          }
        } catch (err) {
          console.error("DB error for category fallback:", err);
        }
      }
    } else if (req.path.startsWith('/produit/')) {
      const slug = req.path.replace(/^\/produit\//, '');
      return res.redirect(301, `/product/${slug}`);
    } else if (req.path.startsWith('/product/')) {
      let slug = req.path.split('/')[2];
      if (slug && (slug.endsWith('-') || slug.endsWith('/'))) {
        const cleanSlug = slug.replace(/[-/]+$/, '');
        return res.redirect(301, `/product/${cleanSlug}`);
      }

      const PRODUCT_REDIRECTS: Record<string, string> = {
        'sonashi-sb-161-blender-electrique-2-en-1-400w': 'blender-electrique-sonashi-sb-161-2-en-1-400w-4-vitesses-mixeur-de-cuisine-compact',
        'sonashi-sfp-918-robot-multifonction-de-cuisine-600w': 'robot-multifonction-de-cuisine-sonashi-sfp-918-600w-hachoir-et-mixeur-polyvalent',
        'sonashi-saf-920-air-fryer-9-2l-2000w': 'air-fryer-sonashi-saf-920-92l-2000w-friteuse-sans-huile-numerique-grande-capacite',
        'sonashi-robot-petrin-multifonctions-en-acier-inoxydable-2000w-12l-6kg-ecran-lcd': 'sonashi-robot-petrin-multifonctions-en-acier-inoxydable-2000w-12-l-6-kg-ecran-lcd',
        'sonashi-svc-9033-aspirateur-sans-fil-180w': 'aspirateur-balai-sans-fil-3-en-1-180w-sonashi-svc-9033-12-kpa-batterie-2600mah',
        'sonashi-saf-115-10l-double-bac-2600w-friteuse-sans-huile': 'air-fryer-sonashi-saf-115-10l-double-bac-2600w-friteuse-sans-huile-numerique-en-inox',
      };
      if (slug && PRODUCT_REDIRECTS[slug]) {
        return res.redirect(301, `/product/${PRODUCT_REDIRECTS[slug]}`);
      }

      try {
        const [product] = await sql`
          SELECT p.id, p.name, p.description, p.seo_title, p.seo_description, p.seo_keywords, p.price, p.promo_price, p.promo_price_start_date, p.promo_price_end_date, p.sku, p.stock, p.is_active, p.variations, p.updated_at, p.created_at,
              CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp' ELSE p.image END as image,
            COALESCE(b.name, p.brand_name, 'Zorando') as brand_name,
            c.name as category_name,
            c.slug as category_slug,
            sub.name as subcategory_name,
            sub.slug as subcategory_slug,
            subsub.name as sub_subcategory_name,
            subsub.slug as sub_subcategory_slug,
            (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as reviews_count,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.product_id = p.id) as avg_rating
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN subcategories sub ON p.subcategory_id = sub.id
            LEFT JOIN sub_subcategories subsub ON p.sub_subcategory_id = subsub.id
            WHERE p.slug = ${slug}
        `;
        if (product) {
          if (product.is_active === false) {
            const redirectUrl = product.category_slug ? `/category/${product.category_slug}` : '/';
            return res.redirect(301, redirectUrl);
          }

          // Edge cache product SSR response: fast delivery while guaranteeing rapid updates for price/stock
          res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=60');
          res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=60');
          res.setHeader('CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=60');

          const lastModified = new Date(product.updated_at || product.created_at || Date.now());
          res.setHeader('ETag', `W/"prod-${product.id}-${product.stock}-${lastModified.getTime()}"`);
          res.setHeader('Last-Modified', lastModified.toUTCString());

          title = product.seo_title || `${product.name} | Prix & Achat | ZORANDO`;
          
          if (product.seo_description) {
            description = cleanForSEO(product.seo_description);
          } else if (product.description) {
            const shortDesc = cleanForSEO(product.description, 80);
            description = `Découvrez ${product.name} sur Zorando. ${shortDesc} Commandez vite au meilleur prix !`;
            if (description.length > 160) {
              description = `Découvrez ${product.name} sur Zorando. Commandez vite au meilleur prix !`;
            }
          } else {
            description = `Achetez ${product.name} au meilleur prix sur ZORANDO.`;
          }
          if (product.seo_keywords) keywords = product.seo_keywords;
          
          if (product.image) {
            if (product.image.startsWith('http')) {
              ogImage = product.image;
            } else if (product.image.startsWith('data:image')) {
              ogImage = `${baseUrl}/api/images/products/${product.id}/image/${slug}.webp?v=${product.image.length}`;
            } else {
              ogImage = product.image.startsWith('/') ? `${baseUrl}${product.image}` : `${baseUrl}/${product.image}`;
            }
          }
          
          let isPromoValid = false;
          if (product.promo_price !== null && product.promo_price !== undefined && !isNaN(Number(product.promo_price)) && Number(product.promo_price) > 0 && Number(product.promo_price) < Number(product.price)) {
              const now = new Date();
              isPromoValid = true;
              if (product.promo_price_start_date && new Date(product.promo_price_start_date) > now) isPromoValid = false;
              if (product.promo_price_end_date && new Date(product.promo_price_end_date) < now) isPromoValid = false;
          }
          
          const currentPrice = isPromoValid ? Number(product.promo_price) : Number(product.price);
          
          const allReviews = await sql`SELECT customer_name, rating, comment, created_at FROM reviews WHERE product_id = ${product.id} ORDER BY created_at DESC`;
          
          const extraImages = await sql`SELECT image FROM product_images WHERE product_id = ${product.id} ORDER BY id ASC`;
          product.images = extraImages.map((img: any) => img.image);
          
          const productSchema = buildProductSchema(product, allReviews, `${baseUrl}${req.path}`, baseUrl);
          
          const breadcrumbItems = [
            { name: 'Accueil', item: baseUrl }
          ];
          if (product.category_slug) {
            breadcrumbItems.push({ name: product.category_name || 'Catégorie', item: `${baseUrl}/category/${product.category_slug}` });
          }
          if (product.subcategory_slug) {
            breadcrumbItems.push({ name: product.subcategory_name, item: `${baseUrl}/category/${product.subcategory_slug}?sub=true` });
          }
          if (product.sub_subcategory_slug) {
            breadcrumbItems.push({ name: product.sub_subcategory_name, item: `${baseUrl}/category/${product.sub_subcategory_slug}?subsub=true` });
          }
          breadcrumbItems.push({ name: product.name, item: `${baseUrl}${req.path}` });
          
          const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);
          
          delete productSchema["@context"];
          delete breadcrumbSchema["@context"];
          const schemaData = { "@context": "https://schema.org", "@graph": [productSchema, breadcrumbSchema].filter(Boolean) };
          
          headHtml += `
<script type="application/ld+json">
${JSON.stringify(schemaData)}
</script>
`;
          
          headHtml += `<meta property="og:type" content="product" />
`;
          headHtml += `<meta name="twitter:card" content="summary_large_image" />
`;
          headHtml += `<meta property="product:price:amount" content="${currentPrice.toFixed(2)}" />
`;
          headHtml += `<meta property="product:price:currency" content="DZD" />
`;
          headHtml += `<meta property="product:availability" content="${product.stock > 0 ? 'in stock' : 'out of stock'}" />
`;
          
          const staticBody = `
            <div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700">
              <h1>${product.name}</h1>
              <img src="${ogImage}" alt="${product.name}" />
              <p><strong>Prix :</strong> ${currentPrice.toFixed(2)} DZD</p>
              <p><strong>Disponibilité :</strong> ${product.stock > 0 ? 'En stock' : 'Rupture de stock'}</p>
              <div>
                <h2>Description</h2>
                <div>${(product.description || description || '').replace(/\n/g, '<br />')}</div>
              </div>
              <div>
                <h2>Catégories</h2>
                <ul>
                  <li><a href="${baseUrl}/category/${product.category_slug}">${product.category_name}</a></li>
                </ul>
              </div>
            </div>
          `;
          seoHtml = staticBody;
        } else {
          isNotFound = true;
        }
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path.startsWith('/blog/')) {
      const slug = req.path.split('/')[2];
      const BLOG_REDIRECTS: Record<string, string> = {
        'hoco-j101a-power-bank-20000mah-avis-test-et-guide-d-achat-2026-algerie': 'power-bank-en-algerie-comment-choisir-la-meilleure-batterie-externe-en-2026',
        'quel-est-le-meilleur-aspirateur-algerie-guide-complet-2024': 'quel-est-le-meilleur-aspirateur-algerie-guide-complet-2026',
      };
      if (slug && BLOG_REDIRECTS[slug]) {
        return res.redirect(301, `/blog/${BLOG_REDIRECTS[slug]}`);
      }

      try {
        const [post] = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND status = 'published'`;
        if (post) {
          title = post.seo_title || post.title || 'ZORANDO Blog';
          description = post.seo_description ? cleanForSEO(post.seo_description) : (post.excerpt ? cleanForSEO(post.excerpt, 160) : `Lisez notre article : ${post.title}`);
          const postImage = post.image_url || post.main_image;
          if (postImage) {
            ogImage = postImage.startsWith('/') ? `${baseUrl}${postImage}` : (postImage.startsWith('http') ? postImage : `${baseUrl}/${postImage}`);
          }

          const currentUrl = `${baseUrl}${req.path}`;
          const blogSchema = buildBlogSchema(post, currentUrl, baseUrl);
          const breadcrumbSchema = buildBreadcrumbSchema([
            { name: 'Accueil', item: `${baseUrl}/` },
            { name: 'Blog', item: `${baseUrl}/blog` },
            { name: post.title, item: currentUrl }
          ]);

          if (blogSchema && breadcrumbSchema) {
            delete (blogSchema as any)["@context"];
            delete (breadcrumbSchema as any)["@context"];
            const graphSchema = {
              "@context": "https://schema.org",
              "@graph": [blogSchema, breadcrumbSchema]
            };
            headHtml += `
<script type="application/ld+json">
${JSON.stringify(graphSchema)}
</script>
`;
          }

          headHtml += `<meta property="og:type" content="article" />\n`;
          headHtml += `<meta name="twitter:card" content="summary_large_image" />\n`;
          if (post.published_at || post.created_at) {
            headHtml += `<meta property="article:published_time" content="${new Date(post.published_at || post.created_at).toISOString()}" />\n`;
          }
          if (post.updated_at) {
            headHtml += `<meta property="article:modified_time" content="${new Date(post.updated_at).toISOString()}" />\n`;
          }

          seoHtml = `
            <div id="seo-static-content" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-emerald max-w-none text-gray-800">
              <nav aria-label="Fil d'Ariane" class="text-sm text-gray-500 mb-4">
                <a href="/">Accueil</a> &gt; <a href="/blog">Blog</a> &gt; <span>${post.title}</span>
              </nav>
              <h1>${post.title}</h1>
              ${postImage ? `<img src="${ogImage}" alt="${post.main_image_alt || post.title}" class="w-full rounded-xl my-6" />` : ''}
              ${post.excerpt ? `<p class="lead text-lg font-medium text-gray-600 mb-6">${post.excerpt}</p>` : ''}
              <div class="article-content leading-relaxed">
                ${post.content || ''}
              </div>
            </div>
          `;
        } else {
          isNotFound = true;
        }
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/blog') {
      title = 'Blog & Actualités | Zorando';
      description = 'Découvrez les dernières tendances, astuces et actualités sur le blog ZORANDO.';
      try {
        const posts = await sql`SELECT title, slug, excerpt FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT 50`;
        seoHtml = `<div id="seo-static-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-sm max-w-none text-gray-700">
          <h1>${title}</h1>
          <p>${description}</p>
          <ul>${posts.map((p: any) => `<li><h2><a href="/blog/${p.slug}">${p.title}</a></h2><p>${p.excerpt}</p></li>`).join('')}</ul>
        </div>`;
      } catch (e) { console.error("DB error in blog SSR", e); }
    } else if (req.path === '/about') {
      title = 'À propos de nous | Zorando';
      description = 'Découvrez l\'histoire de ZORANDO, votre boutique en ligne de confiance en Algérie.';
      seoHtml = '';
    } else if (req.path === '/programme-fidelite') {
      title = 'Programme de fidélité | Zorando';
      description = 'Rejoignez le programme de fidélité ZORANDO et profitez de récompenses exclusives.';
      seoHtml = '';
    } else if (req.path === '/retours') {
      title = 'Politique de retours | Zorando';
      description = 'Consultez notre politique de retours et remboursements.';
      seoHtml = '';
    } else if (req.path === '/track-order') {
      title = 'Suivre ma commande | Zorando';
      description = 'Suivez l\'état de votre commande ZORANDO en temps réel.';
      seoHtml = '';
    }

    const globalNav = `
      <nav id="global-nav" class="sr-only">
        <a href="/">Accueil</a>
        <a href="/brands">Marques</a>
        <a href="/about">À propos</a>
        <a href="/programme-fidelite">Programme de fidélité</a>
        <a href="/retours">Retours</a>
        <a href="/track-order">Suivi de commande</a>
      </nav>
    `;

    
    if (isNotFound) {
      title = 'Page Introuvable | Zorando';
      description = 'La page que vous recherchez n\'existe pas ou a été supprimée.';
    }

    
    // Nettoyage robuste du titre
    let cleanTitle = title.replace(/\s*[-–—|]\s*ZORANDO\s*$/i, '');
    cleanTitle = cleanTitle.replace(/[-–—\s]+$/, '');
    title = cleanTitle + ' | Zorando';
    
    let seoTags = `
      <title data-rh="true">${title}</title>
      <meta data-rh="true" name="description" content="${description}" />
      ${keywords ? `` : ''}
      <meta data-rh="true" property="og:title" content="${title}" />
      <meta data-rh="true" property="og:description" content="${description}" />
      <meta data-rh="true" property="og:image" content="${ogImage}" />
      <meta data-rh="true" property="og:url" content="${ogUrl}" />
      <meta data-rh="true" name="twitter:title" content="${title}" />
      <meta data-rh="true" name="twitter:description" content="${description}" />
      <meta data-rh="true" name="twitter:image" content="${ogImage}" />
    
      <meta data-rh="true" name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`;
    
    let finalHtml = template.replace('<!--seo-injection-->', globalNav);
    finalHtml = finalHtml.replace('<div id="root"></div>', `<div id="root">${seoHtml || ''}</div>`);

    // Supprimer les balises title et meta par défaut du template pour éliminer TOUT doublon SEO
    finalHtml = finalHtml.replace(/<title[\s\S]*?<\/title>/gi, '');
    finalHtml = finalHtml.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/gi, '');
    finalHtml = finalHtml.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/gi, '');
    finalHtml = finalHtml.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/gi, '');

    finalHtml = finalHtml.replace('<!--head-injection-->', headHtml + seoTags);

    const sUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const sKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (sUrl) finalHtml = finalHtml.replaceAll('%VITE_SUPABASE_URL%', sUrl);
    if (sKey) finalHtml = finalHtml.replaceAll('%VITE_SUPABASE_ANON_KEY%', sKey);
    
    if (isNotFound) {
      res.header('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(404).send(finalHtml);
    } else {
      res.header('X-Robots-Tag', 'all');
      res.header('Content-Type', 'text/html; charset=utf-8');
      
      // Add Vercel Edge Cache Control for Public HTML (if not already set specifically by route)
      if (!res.getHeader('Cache-Control')) {
        if (req.method === 'GET' && (!req.headers.cookie || !req.headers.cookie.match(/session|token|auth|user/i))) {
          res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        } else {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
      
      res.status(200).send(finalHtml);
    }

  } catch (err) {
    console.error('SEO Injection Error:', err);
    res.status(500).send('Erreur lors du rendu de la page SEO');
  }
});

// Global error handler for debugging
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Export the Express API for Vercel Serverless Functions

async function startServer() {
  const PORT = 3000;
  
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'custom',
    });
    // Add vite middleware right before the SEO wildcard handler
    const getStarIndex = app._router.stack.findIndex((layer: any) => layer.route && layer.route.path === '*');
    if (getStarIndex !== -1) {
      const starLayer = app._router.stack.splice(getStarIndex, 1)[0];
      app.use(vite.middlewares);
      app._router.stack.push(starLayer);
    } else {
      app.use(vite.middlewares);
    }
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

