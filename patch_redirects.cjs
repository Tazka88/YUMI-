const fs = require('fs');

const redirectsToAdd = `    '/product/hoco-casque-sans-w45': '/product/hoco-casque-sans-fil-bluetooth-5-3-400mah-w45',
    '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-cran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque': '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque',
    '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-172-pouces-bt54-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque': '/product/mi-band-10-bracelet-inteligent-150-modes-sportifs-ecran-amoled-1-72-pouces-bt5-4-endurance-21-jours-5atm-diffusion-de-frequence-cardiaque',`;

for (const file of ['api/index.ts', 'server.ts']) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Find where staticRedirects are defined
  if (code.includes("const staticRedirects = {")) {
    code = code.replace("const staticRedirects = {", "const staticRedirects: Record<string, string> = {\n" + redirectsToAdd);
    fs.writeFileSync(file, code);
    console.log(`Updated ${file} with redirects.`);
  } else if (code.includes("const staticRedirects: Record<string, string> = {")) {
    code = code.replace("const staticRedirects: Record<string, string> = {", "const staticRedirects: Record<string, string> = {\n" + redirectsToAdd);
    fs.writeFileSync(file, code);
    console.log(`Updated ${file} with redirects.`);
  }
}
