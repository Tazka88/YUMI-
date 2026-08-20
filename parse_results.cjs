const fs = require('fs');

const html = fs.readFileSync('/tmp/prod_home.html', 'utf8');
const preloadMobile = html.match(/<link rel="preload" as="image" href="([^"]+)" media="\(max-width: 767px\)"/);
const preloadDesktop = html.match(/<link rel="preload" as="image" href="([^"]+)" media="\(min-width: 768px\)"/);

const banners = JSON.parse(fs.readFileSync('/tmp/banners.json', 'utf8'));
const activeCategoryNull = banners.filter(b => b.is_active && b.category_id === null);

console.log("--- MOBILE ---");
console.log("Preload URL: " + (preloadMobile ? preloadMobile[1] : "Not found"));
console.log("Image URL: " + activeCategoryNull[0].mobile_image_url + "&w=640");
console.log("Identiques: " + (preloadMobile[1] === (activeCategoryNull[0].mobile_image_url + "&w=640") ? "OUI" : "NON"));

console.log("\n--- DESKTOP ---");
console.log("Preload URL: " + (preloadDesktop ? preloadDesktop[1] : "Not found"));
console.log("Image URL: " + activeCategoryNull[0].image_url + "&w=1600");
console.log("Identiques: " + (preloadDesktop[1] === (activeCategoryNull[0].image_url + "&w=1600") ? "OUI" : "NON"));
