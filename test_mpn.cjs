const fs = require('fs');

(async () => {
    try {
        const { default: app } = await import('./api/index.ts');
        const server = app.listen(3005, async () => {
            const fetch = (await import('node-fetch')).default;
            const res = await fetch('http://localhost:3005/product/tondeuse-kemei-km-1847-sans-fil-etanche-avec-lame-ceramique-et-ecran-lcd-tondeuse-professionnelle-algerie');
            const text = await res.text();
            const match = text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
            if (match) {
                const schema = JSON.parse(match[1]);
                console.log(JSON.stringify(schema, null, 2));
            } else {
                console.log("No ld+json found");
            }
            server.close();
            process.exit(0);
        });
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
