const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Replace static footer code with lazy loading component
const footerStart = layout.indexOf('      {/* Footer */}');
const footerEnd = layout.lastIndexOf('    </div>');

if (footerStart > -1 && footerEnd > footerStart) {
  const footerCode = layout.substring(footerStart, footerEnd);
  
  const lazyFooter = `      {/* Lazy Loaded Footer */}
      <React.Suspense fallback={<div className="h-64 bg-gray-900 animate-pulse mt-12" />}>
        <Footer footerLinks={footerLinks} settings={settings} />
      </React.Suspense>
`;
  
  layout = layout.replace(footerCode, lazyFooter);
}

// Add the lazy import
if (!layout.includes('const Footer =')) {
  // Find a good place to put it
  layout = layout.replace(
    'import TopBar from \'./TopBar\';',
    'import TopBar from \'./TopBar\';\nconst Footer = React.lazy(() => import(\'./Footer\'));'
  );
}

fs.writeFileSync('src/components/Layout.tsx', layout);
console.log('Layout updated with lazy Footer');
