const fs = require('fs');

let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const searchTarget = `  return (
    <div className="container mx-auto px-4 py-8">`;

const replacement = `  return (
    <>
      <SEO title="Paiement - ZORANDO" description="Finalisez votre commande." noindex={true} />
    <div className="container mx-auto px-4 py-8">`;

if (code.includes(searchTarget) && !code.includes('<SEO title="Paiement')) {
    code = code.replace(searchTarget, replacement);
    // Find the end to add </>
    const lastBrace = code.lastIndexOf('}');
    const beforeBrace = code.substring(0, lastBrace);
    const lastParen = beforeBrace.lastIndexOf(')');
    if (lastParen !== -1) {
        code = beforeBrace.substring(0, lastParen) + '</>\n  )\n}';
        fs.writeFileSync('src/pages/Checkout.tsx', code);
        console.log("Safe inject successful");
    }
}
