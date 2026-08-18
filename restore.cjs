const fs = require('fs');

let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

// remove the bad <> and SEO
code = code.replace(/return \(\n    <>\n      <SEO title="Paiement - ZORANDO" description="Finalisez votre commande." noindex={true} \/>/g, 'return (');
// also fix the one that didn't have \n
code = code.replace(/return \(\s*<>\s*<SEO title="Paiement - ZORANDO" description="Finalisez votre commande." noindex={true} \/>/g, 'return (');

// Remove any closing </> at the end
code = code.replace(/<\/>\n  \)\n}$/, '  )\n}');

fs.writeFileSync('src/pages/Checkout.tsx', code);
