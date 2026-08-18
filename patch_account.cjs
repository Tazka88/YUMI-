const fs = require('fs');

function addSEO(file, title, description) {
    if(!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    if (!code.includes("import SEO")) {
        code = code.replace("import React", "import React");
        const lines = code.split('\n');
        let importIdx = 0;
        for(let i=0; i<lines.length; i++) {
            if(lines[i].startsWith('import ')) importIdx = i;
        }
        lines.splice(importIdx + 1, 0, "import SEO from '../../components/SEO';");
        code = lines.join('\n');
    }

    if (!code.includes("<SEO")) {
        const returnStart = code.indexOf('return (');
        if (returnStart !== -1) {
            code = code.substring(0, returnStart + 8) + `\n    <SEO title="${title} - ZORANDO" description="${description}" noindex={true} />` + code.substring(returnStart + 8);
            fs.writeFileSync(file, code);
            console.log(`${file} patched successfully.`);
        }
    }
}

addSEO('src/pages/Account/Login.tsx', 'Connexion', 'Connectez-vous à votre compte ZORANDO.');
addSEO('src/pages/Account/Register.tsx', 'Créer un compte', 'Créez votre compte ZORANDO.');
addSEO('src/pages/Account/ForgotPassword.tsx', 'Mot de passe oublié', 'Réinitialisez votre mot de passe ZORANDO.');
addSEO('src/pages/Account/AccountLayout.tsx', 'Mon Compte', 'Gérez votre compte ZORANDO.');

