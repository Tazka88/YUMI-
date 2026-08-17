import re

with open('server.ts', 'r') as f:
    content = f.read()

# 1. Update headHtml (canonical)
content = re.sub(
    r'let headHtml = `<link rel="canonical" href="\$\{baseUrl\}\$\{reqCanonicalPath\}" id="ssr-canonical" />`;',
    r'let headHtml = `<link data-rh="true" rel="canonical" href="${baseUrl}${reqCanonicalPath}" />`;',
    content
)

# 2. Remove seoHtml h1/h2 tags
content = re.sub(
    r'let seoHtml = `\s*<div id="seo-content" style="display:none;">\s*<h1>\$\{title\}</h1>\s*<h2>ZORANDO - Informations</h2>\s*<p>\$\{description\}</p>\s*<p>Page: \$\{req\.path\}</p>\s*</div>\s*`;',
    r'let seoHtml = ``;',
    content
)

# 3. Add Blog routing logic
blog_logic = """        } else if (req.path.startsWith('/blog/')) {
          const slug = req.path.split('/')[2];
          const [post] = await sql`
            SELECT title, excerpt, seo_title, seo_description, main_image
            FROM blog_posts
            WHERE slug = ${slug} AND status = 'published'
          `;
          if (post) {
            title = post.seo_title || post.title || 'ZORANDO Blog';
            description = post.seo_description || post.excerpt || `Lisez notre article : ${post.title}`;
            if (post.main_image) {
              ogImage = post.main_image.startsWith('/') ? `${baseUrl}${post.main_image}` : `${baseUrl}/${post.main_image}`;
            }
          } else {
            isNotFound = true;
          }
        } else if (req.path === '/blog') {
          title = 'Blog & Actualités - ZORANDO';
          description = 'Découvrez les dernières tendances, astuces et actualités sur le blog ZORANDO.';"""

content = content.replace("        } else if (req.path === '/about') {", blog_logic + "\n        } else if (req.path === '/about') {")

# 4. Update replacements to use data-rh="true"
content = content.replace("finalHtml = finalHtml.replace(/<title>.*?<\\/title>/, `<title>${title}</title>`);",
                          "finalHtml = finalHtml.replace(/<title.*?>.*?<\\/title>/, `<title data-rh=\"true\">${title}</title>`);")

content = content.replace('finalHtml = finalHtml.replace(/<meta name="description" content=".*?" \\/>/, `<meta name="description" content="${description}" />`);',
                          'finalHtml = finalHtml.replace(/<meta.*?name="description".*?>/, `<meta data-rh="true" name="description" content="${description}" />`);')

# OG Tags replacements
content = content.replace('finalHtml = finalHtml.replace(/<meta property="og:title" content=".*?" \\/>/g, `<meta property="og:title" content="${title}" />`);',
                          'finalHtml = finalHtml.replace(/<meta.*?property="og:title".*?>/g, `<meta data-rh="true" property="og:title" content="${title}" />`);')

content = content.replace('finalHtml = finalHtml.replace(/<meta property="og:description" content=".*?" \\/>/g, `<meta property="og:description" content="${description}" />`);',
                          'finalHtml = finalHtml.replace(/<meta.*?property="og:description".*?>/g, `<meta data-rh="true" property="og:description" content="${description}" />`);')

content = content.replace('finalHtml = finalHtml.replace(/<meta property="og:image" content=".*?" \\/>/g, `<meta property="og:image" content="${ogImage}" />`);',
                          'finalHtml = finalHtml.replace(/<meta.*?property="og:image".*?>/g, `<meta data-rh="true" property="og:image" content="${ogImage}" />`);')

content = content.replace('finalHtml = finalHtml.replace(/<meta property="og:url" content=".*?" \\/>/g, `<meta property="og:url" content="${ogUrl}" />`);',
                          'finalHtml = finalHtml.replace(/<meta.*?property="og:url".*?>/g, `<meta data-rh="true" property="og:url" content="${ogUrl}" />`);')

content = content.replace('finalHtml = finalHtml.replace(/<meta name="twitter:title" content=".*?" \\/>/g, `<meta name="twitter:title" content="${title}" />`);',
                          'finalHtml = finalHtml.replace(/<meta.*?name="twitter:title".*?>/g, `<meta data-rh="true" name="twitter:title" content="${title}" />`);')

content = content.replace('finalHtml = finalHtml.replace(/<meta name="twitter:description" content=".*?" \\/>/g, `<meta name="twitter:description" content="${description}" />`);',
                          'finalHtml = finalHtml.replace(/<meta.*?name="twitter:description".*?>/g, `<meta data-rh="true" name="twitter:description" content="${description}" />`);')

content = content.replace('finalHtml = finalHtml.replace(/<meta name="twitter:image" content=".*?" \\/>/g, `<meta name="twitter:image" content="${ogImage}" />`);',
                          'finalHtml = finalHtml.replace(/<meta.*?name="twitter:image".*?>/g, `<meta data-rh="true" name="twitter:image" content="${ogImage}" />`);')

# 5. X-Robots-Tag logic
robots_logic = """        if (isNotFound) {
          res.header('X-Robots-Tag', 'noindex, follow');
        } else {
          res.header('X-Robots-Tag', 'all');
        }"""
content = content.replace("        res.header('X-Robots-Tag', 'all');", robots_logic)

with open('server.ts', 'w') as f:
    f.write(content)
