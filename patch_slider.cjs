const fs = require('fs');
let content = fs.readFileSync('src/components/Slider.tsx', 'utf-8');

const target = `  const [slides, setSlides] = useState<SliderImage[]>(() => {
    if (!categoryId) {
      return [{
        id: -1,
        image_url: '/api/hero-banners/first-image/desktop',
        mobile_image_url: '/api/hero-banners/first-image/mobile',
        category_id: null,
        position: 0,
        is_active: true,
      }];
    }
    return [];
  });`;

const replacement = `  const [slides, setSlides] = useState<SliderImage[]>([]);`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Slider.tsx', content);
  console.log("Success Slider");
} else {
  console.log("Target not found");
}
