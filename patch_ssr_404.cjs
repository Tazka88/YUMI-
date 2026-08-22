const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // 1. Add redirect mapping before app.get('*')
  const redirectMiddleware = `
  const staticRedirects = {
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
`;

  // Insert redirectMiddleware before app.get('*', ...)
  if (content.includes("app.get('*', async (req, res, next) => {")) {
    // avoid double injection if run twice
    if (!content.includes("const staticRedirects = {")) {
        content = content.replace("app.get('*', async (req, res, next) => {", redirectMiddleware + "\napp.get('*', async (req, res, next) => {");
    }
  }

  // 2. We need to completely sync the SSR logic inside app.get('*') from server.ts to api/index.ts
  // Instead of doing complex string replacements, let's just make api/index.ts use exactly the same logic as server.ts for 404s and blog.
  // Actually, I will write a regex/replacement logic specifically for api/index.ts since it's the one missing it.
  
  if (filepath === 'api/index.ts') {
    // Add isNotFound = false;
    content = content.replace(/let seoHtml = '';/, "let seoHtml = '';\n    let isNotFound = false;");

    // Add else isNotFound = true to brand
    content = content.replace(/const products = await sql\`SELECT name, slug FROM products WHERE brand_id = \$\{brand.id\}\`;\s*seoHtml = '';\s*\}/g, "const products = await sql\`SELECT name, slug FROM products WHERE brand_id = \$\{brand.id\}\`;\n          seoHtml = '';\n        } else {\n          isNotFound = true;\n        }");
    
    // Add else isNotFound = true to product
    content = content.replace(/headHtml \+= \`\\n<script type="application\/ld\+json">\\n\$\{JSON.stringify\(schemaData\)\}\\n<\/script>\\n\`;\s*\}/, "headHtml += `\\n<script type=\"application/ld+json\">\\n${JSON.stringify(schemaData)}\\n</script>\\n`;\n        } else {\n          isNotFound = true;\n        }");
    
    // Add blog route logic
    const blogLogic = `} else if (req.path.startsWith('/blog/')) {
      const slug = req.path.split('/')[2];
      try {
        const [post] = await sql\`SELECT title, excerpt, seo_title, seo_description, main_image FROM blog_posts WHERE slug = \${slug} AND status = 'published'\`;
        if (post) {
          title = post.seo_title || post.title || 'ZORANDO Blog';
          description = post.seo_description ? cleanForSEO(post.seo_description) : (post.excerpt ? cleanForSEO(post.excerpt, 160) : \`Lisez notre article : \${post.title}\`);
          if (post.main_image) {
            ogImage = post.main_image.startsWith('/') ? \`\${baseUrl}\${post.main_image}\` : \`\${baseUrl}/\${post.main_image}\`;
          }
        } else {
          isNotFound = true;
        }
      } catch(e) { console.error("DB Error in SSR:", e); }
    } else if (req.path === '/blog') {
      title = 'Blog & Actualités - ZORANDO';
      description = 'Découvrez les dernières tendances, astuces et actualités sur le blog ZORANDO.';
    `;
    content = content.replace(/} else if \(req\.path === '\/about'\) \{/, blogLogic + "} else if (req.path === '/about') {");

    // Change status code handling at the end of api/index.ts
    const finalHtmlReplace = `
    if (isNotFound) {
      title = 'Page Introuvable - ZORANDO';
      description = 'La page que vous recherchez n\\'existe pas ou a été supprimée.';
    }

    let seoTags = \`
      <title data-rh="true">\${title}</title>
      <meta data-rh="true" name="description" content="\${description}" />
      \${keywords ? \`<meta data-rh="true" name="keywords" content="\${keywords}" />\` : ''}
      <meta data-rh="true" property="og:title" content="\${title}" />
      <meta data-rh="true" property="og:description" content="\${description}" />
      <meta data-rh="true" property="og:image" content="\${ogImage}" />
      <meta data-rh="true" property="og:url" content="\${ogUrl}" />
      <meta data-rh="true" name="twitter:title" content="\${title}" />
      <meta data-rh="true" name="twitter:description" content="\${description}" />
      <meta data-rh="true" name="twitter:image" content="\${ogImage}" />
    \`;
    
    let finalHtml = template.replace('<!--seo-injection-->', globalNav + (seoHtml || ''));
    finalHtml = finalHtml.replace('<!--head-injection-->', headHtml + seoTags);
    
    if (isNotFound) {
      res.header('X-Robots-Tag', 'noindex, follow');
      res.setHeader('Cache-Control', 'no-cache');
      res.status(404).send(finalHtml);
    } else {
      res.header('X-Robots-Tag', 'all');
      res.header('Content-Type', 'text/html; charset=utf-8');
      
      // Add Vercel Edge Cache Control for Public HTML
      if (req.method === 'GET' && (!req.headers.cookie || !req.headers.cookie.match(/session|token|auth|user/i))) {
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
      
      res.status(200).send(finalHtml);
    }
`;
    // We need to replace everything from "let seoTags = `" to "res.status(200).send(finalHtml);"
    // Since it's multiline and could have issues, let's use string manipulation safely.
    const startIdx = content.indexOf('let seoTags = `');
    const endIdx = content.indexOf('res.status(200).send(finalHtml);') + 'res.status(200).send(finalHtml);'.length;
    
    if (startIdx > -1 && endIdx > -1) {
      content = content.substring(0, startIdx) + finalHtmlReplace + content.substring(endIdx);
    }
  } else if (filepath === 'server.ts') {
      // server.ts already has the logic, just add the new hoco blog redirect to the existing redirects dictionary.
      content = content.replace("'/brands/karcher': '/brands/nettoyage-karcher-algerie'", "'/brands/karcher': '/brands/nettoyage-karcher-algerie',\n    '/blog/hoco-power-bank-en-algerie-guide-complet-prix-et-avis-2026': '/blog'");
  }

  fs.writeFileSync(filepath, content);
  console.log('Patched ' + filepath);
}

patchFile('server.ts');
patchFile('api/index.ts');

