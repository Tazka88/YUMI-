const fs = require('fs');
const banners = JSON.parse(fs.readFileSync('/tmp/banners.json', 'utf8'));
const activeCategoryNull = banners.filter(b => b.is_active && b.category_id === null);
if(activeCategoryNull.length > 0) {
    console.log("React Mobile URL: " + activeCategoryNull[0].mobile_image_url + "&w=640");
    console.log("React Desktop URL: " + activeCategoryNull[0].image_url + "&w=1600");
}
