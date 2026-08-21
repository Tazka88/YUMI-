const fs = require('fs');
const banners = JSON.parse(fs.readFileSync('/tmp/prod_banners.json', 'utf8'));
const activeCategoryNull = banners.filter(b => b.is_active && b.category_id === null);
console.log("React First Banner ID:", activeCategoryNull[0].id);
console.log("React First Banner Mobile Image:", activeCategoryNull[0].mobile_image_url);
