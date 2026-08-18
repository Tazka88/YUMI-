const fs = require('fs');
const file = 'src/pages/Checkout.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes("import SEO")) {
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport SEO from '../components/SEO';");
}

if (!code.includes("<SEO")) {
    const returnStart = code.indexOf('return (');
    if (returnStart !== -1) {
        code = code.substring(0, returnStart + 8) + '\n    <SEO title="Paiement - ZORANDO" description="Finalisez votre commande." noindex={true} />' + code.substring(returnStart + 8);
        fs.writeFileSync(file, code);
        console.log("Checkout patched successfully.");
    }
}
