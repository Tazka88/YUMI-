const fs = require('fs');

let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// 1. Remove CookieBanner and lazy Footer imports
layout = layout.replace("import CookieBanner from './CookieBanner';\n", "");
layout = layout.replace("const Footer = React.lazy(() => import('./Footer'));\n", "");

// 2. Extract footer inner code
let footerCode = fs.readFileSync('src/components/Footer.tsx', 'utf8');
let match = footerCode.match(/return \(\s*(<footer[\s\S]*<\/footer>)\s*\);/);
if (match) {
  let innerFooter = match[1];
  
  // 3. Replace the Suspense and CookieBanner block with the original Footer
  let targetBlock = `      {/* Lazy Loaded Footer */}
      <React.Suspense fallback={<div className="h-64 bg-gray-900 animate-pulse mt-12" />}>
        <Footer footerLinks={footerLinks} settings={settings} />
      </React.Suspense>
      <CookieBanner />`;
      
  let newFooterBlock = `      {/* Footer */}
      ${innerFooter}`;

  layout = layout.replace(targetBlock, newFooterBlock);
  fs.writeFileSync('src/components/Layout.tsx', layout);
  console.log("Layout.tsx reverted");
} else {
  console.log("Could not match footer block");
}
