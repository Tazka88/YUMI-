const fs = require('fs');

function fix(file) {
    if(!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace the problematic returns
    code = code.replace(/return \(\n\s*<SEO (.*?)\/>\n\s*<div/g, 'return (\n    <>\n      <SEO $1/>\n      <div');
    code = code.replace(/return \(\n\s*<SEO (.*?)\/>\n\s*<main/g, 'return (\n    <>\n      <SEO $1/>\n      <main');
    
    if(file.includes('Checkout.tsx')) {
        code = code.replace('return (\n    <SEO title="Paiement - ZORANDO" description="Finalisez votre commande." noindex={true} />) => controller.abort();', 'return () => controller.abort();');
        // Find the real return for Checkout
        const realReturn = code.lastIndexOf('return (');
        if (realReturn !== -1) {
            if (!code.substring(realReturn, realReturn + 100).includes('<SEO')) {
                const afterReturn = code.substring(realReturn + 8);
                const firstTagMatch = afterReturn.match(/^\s*<[a-zA-Z]+/);
                if (firstTagMatch) {
                   code = code.substring(0, realReturn + 8) + '\n    <>\n      <SEO title="Paiement - ZORANDO" description="Finalisez votre commande." noindex={true} />' + afterReturn;
                   // Add closing fragment before the final }
                   const lastBrace = code.lastIndexOf('}');
                   const beforeBrace = code.substring(0, lastBrace);
                   const lastParen = beforeBrace.lastIndexOf(')');
                   code = beforeBrace.substring(0, lastParen) + '</>\n  )\n}';
                }
            }
        }
    }
    
    if (file.includes('Login.tsx') || file.includes('Register.tsx') || file.includes('ForgotPassword.tsx') || file.includes('AccountLayout.tsx')) {
        // Find the last )
        const lastBrace = code.lastIndexOf('}');
        const beforeBrace = code.substring(0, lastBrace);
        const lastParen = beforeBrace.lastIndexOf(')');
        if (lastParen !== -1) {
            code = beforeBrace.substring(0, lastParen) + '\n    </>\n  )\n}';
        }
    }
    
    fs.writeFileSync(file, code);
}

fix('src/pages/Account/Login.tsx');
fix('src/pages/Account/Register.tsx');
fix('src/pages/Account/ForgotPassword.tsx');
fix('src/pages/Account/AccountLayout.tsx');
fix('src/pages/Checkout.tsx');

