import app from './api/index.ts';
import fetch from 'node-fetch';

const server = app.listen(3006, async () => {
    try {
      const res = await fetch('http://localhost:3006/product/tondeuse-kemei-km-1847-sans-fil-etanche-avec-lame-ceramique-et-ecran-lcd-tondeuse-professionnelle-algerie');
      const text = await res.text();
      console.log("Root div content:", text.match(/<div id="root">([\s\S]*?)<\/div>/)[0].substring(0, 1000));
    } finally {
      server.close();
      process.exit(0);
    }
});
