const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const target = `    let finalHtml = template.replace('<!--seo-injection-->', globalNav + seoHtml);
    finalHtml = finalHtml.replace('<!--head-injection-->', headHtml);
    finalHtml = finalHtml.replace(/<title.*?>.*?<\\/title>/, \`<title data-rh="true">\${title}</title>\`);
    finalHtml = finalHtml.replace(/<meta.*?name="description".*?>/, \`<meta data-rh="true" name="description" content="\${description}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?name="keywords".*?>/, \`<meta data-rh="true" name="keywords" content="\${keywords}" />\`);
    
    // Update OG Tags dynamically
    finalHtml = finalHtml.replace(/<meta.*?property="og:title".*?>/g, \`<meta data-rh="true" property="og:title" content="\${title}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?property="og:description".*?>/g, \`<meta data-rh="true" property="og:description" content="\${description}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?property="og:image".*?>/g, \`<meta data-rh="true" property="og:image" content="\${ogImage}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?property="og:url".*?>/g, \`<meta data-rh="true" property="og:url" content="\${ogUrl}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?name="twitter:title".*?>/g, \`<meta data-rh="true" name="twitter:title" content="\${title}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?name="twitter:description".*?>/g, \`<meta data-rh="true" name="twitter:description" content="\${description}" />\`);
    finalHtml = finalHtml.replace(/<meta.*?name="twitter:image".*?>/g, \`<meta data-rh="true" name="twitter:image" content="\${ogImage}" />\`);`;

const replacement = `    let seoTags = \`
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
    
    let finalHtml = template.replace('<!--seo-injection-->', globalNav + seoHtml);
    finalHtml = finalHtml.replace('<!--head-injection-->', headHtml + seoTags);`;

if(code.includes("finalHtml = finalHtml.replace(/<title")) {
  code = code.replace(target, replacement);
  fs.writeFileSync('api/index.ts', code);
  console.log("api/index.ts patched.");
} else {
  console.log("Could not find target in api/index.ts");
}
