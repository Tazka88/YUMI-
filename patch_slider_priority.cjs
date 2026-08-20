const fs = require('fs');
let content = fs.readFileSync('src/components/Slider.tsx', 'utf-8');

const target = 'loading={index === 0 ? "eager" : "lazy"}';
const replacement = 'loading={index === 0 ? "eager" : "lazy"}\n              fetchPriority={index === 0 ? "high" : "auto"}';

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/components/Slider.tsx', content);
  console.log("Success Slider Priority");
} else {
  console.log("Target not found");
}
