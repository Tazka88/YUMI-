const fs = require('fs');

function patch(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  
  const regex = /let finalHtml = template\.replace\([\s\S]*?if\s*\(\s*isNotFound\s*\)/;
  
  const replacement = `let seoTags = \`
          <title data-rh="true">\${title}</title>
          <meta data-rh="true" name="description" content="\${description}" />
          \${typeof keywords !== 'undefined' && keywords ? \`<meta data-rh="true" name="keywords" content="\${keywords}" />\` : ''}
          <meta data-rh="true" property="og:title" content="\${title}" />
          <meta data-rh="true" property="og:description" content="\${description}" />
          <meta data-rh="true" property="og:image" content="\${typeof ogImage !== 'undefined' ? ogImage : ''}" />
          <meta data-rh="true" property="og:url" content="\${typeof ogUrl !== 'undefined' ? ogUrl : ''}" />
          <meta data-rh="true" name="twitter:title" content="\${title}" />
          <meta data-rh="true" name="twitter:description" content="\${description}" />
          <meta data-rh="true" name="twitter:image" content="\${typeof ogImage !== 'undefined' ? ogImage : ''}" />
        \`;
        
        let finalHtml = template.replace('<!--seo-injection-->', typeof seoHtml !== 'undefined' ? seoHtml : '');
        finalHtml = finalHtml.replace('<!--head-injection-->', (typeof headHtml !== 'undefined' ? headHtml : '') + seoTags);
        
        if (isNotFound)`;

  if(code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(filepath, code);
    console.log(filepath + " patched successfully.");
  } else {
    console.log("Could not find regex in " + filepath);
  }
}

patch('server.ts');
patch('api/index.ts');

