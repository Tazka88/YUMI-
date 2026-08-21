const fs = require('fs');

const html = fs.readFileSync('/tmp/prod_home.html', 'utf8');
const preloadMobileMatch = html.match(/<link rel="preload" as="image" href="([^"]+)" media="\(max-width: 767px\)"/);
const preloadDesktopMatch = html.match(/<link rel="preload" as="image" href="([^"]+)" media="\(min-width: 768px\)"/);

const preloadMobile = preloadMobileMatch ? preloadMobileMatch[1] : "Not found";
const preloadDesktop = preloadDesktopMatch ? preloadDesktopMatch[1] : "Not found";

const banners = JSON.parse(fs.readFileSync('/tmp/banners.json', 'utf8'));
const activeCategoryNull = banners.filter(b => b.is_active && b.category_id === null);

const imageMobile = activeCategoryNull.length > 0 ? activeCategoryNull[0].mobile_image_url + "&w=640" : "Not found";
const imageDesktop = activeCategoryNull.length > 0 ? activeCategoryNull[0].image_url + "&w=1600" : "Not found";

console.log("--- MOBILE ---");
console.log("Preload URL: " + preloadMobile);
console.log("Image URL: " + imageMobile);
console.log("Identiques: " + (preloadMobile === imageMobile ? "OUI" : "NON"));

console.log("\n--- DESKTOP ---");
console.log("Preload URL: " + preloadDesktop);
console.log("Image URL: " + imageDesktop);
console.log("Identiques: " + (preloadDesktop === imageDesktop ? "OUI" : "NON"));
