import app from './api/index.ts';
import fetch from 'node-fetch';

const server = app.listen(3003, async () => {
    try {
      const res = await fetch('http://localhost:3003/product/tondeuse-kemei-km-1847-sans-fil-etanche-avec-lame-ceramique-et-ecran-lcd-tondeuse-professionnelle-algerie');
      const text = await res.text();
      console.log("Result contains ld+json:", text.includes("ld+json"));
    } finally {
      server.close();
      process.exit(0);
    }
});
