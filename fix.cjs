const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');
    
    // remove the bad replacements
    const badCheckout = `return (\\n    <SEO title="Paiement - ZORANDO" description="Finalisez votre commande." noindex={true} />) => controller.abort();`;
    code = code.replace(/return \(\n    <SEO.*?\/>\)/g, 'return (');
    
    // actually, let's just restore them by replacing the exact string
    if (file.includes('Checkout')) {
        code = code.replace('return (\n    <SEO title="Paiement - ZORANDO" description="Finalisez votre commande." noindex={true} />) => controller.abort();', 'return () => controller.abort();');
    }
    if (file.includes('Login')) {
        code = code.replace('return (\n    <SEO title="Connexion - ZORANDO" description="Connectez-vous à votre compte ZORANDO." noindex={true} />    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">', 'return (\n    <>\n    <SEO title="Connexion - ZORANDO" description="Connectez-vous à votre compte ZORANDO." noindex={true} />\n    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">');
        code = code.replace(/<p className="mt-2 text-center text-sm text-gray-600">\s*<\/div>\s*<\/div>\s*\)\s*}/g, '<p className="mt-2 text-center text-sm text-gray-600">\n        </div>\n      </div>\n    </>\n  )\n}');
    }
    fs.writeFileSync(file, code);
}
// wait, I can just read the original file content? No, git is not available.
