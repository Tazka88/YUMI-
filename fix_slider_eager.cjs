const fs = require('fs');
let content = fs.readFileSync('src/components/Slider.tsx', 'utf8');

content = content.replace(/loading=\{index === 0 \? "eager" : "lazy"\}/g, 'loading="eager"');
content = content.replace(/fetchPriority=\{index === 0 \? "high" : "auto"\}/g, 'fetchPriority="high"');
content = content.replace(/decoding=\{index === 0 \? "sync" : "async"\}/g, 'decoding="async"'); // user asked for decoding="async"

fs.writeFileSync('src/components/Slider.tsx', content);
console.log("Fixed Slider.tsx loading eager");
