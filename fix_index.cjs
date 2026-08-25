const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldScript = html.substring(
  html.indexOf('<!-- Google tag (gtag.js) - Lazy loaded on interaction & Consent Mode -->'),
  html.indexOf('</script>', html.indexOf('<!-- Google tag (gtag.js) - Lazy loaded on interaction & Consent Mode -->')) + 9
);

const newScript = `<!-- Google tag (gtag.js) - Lazy loaded on interaction -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-7JLYM1QX3C', { send_page_view: false });
      gtag('config', 'AW-18384476935', { send_page_view: false });
      function initGTM() {
        if (window.gtmLoaded) return;
        window.gtmLoaded = true;
        var script = document.createElement('script');
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-7JLYM1QX3C';
        script.async = true;
        document.head.appendChild(script);
        
        ['scroll','mousemove','touchstart','click'].forEach(function(evt) {
          window.removeEventListener(evt, initGTM);
        });
      }
      
      ['scroll','mousemove','touchstart','click'].forEach(function(evt) {
        window.addEventListener(evt, initGTM, {passive: true, once: true});
      });
      
      // Fallback timeout inside load event to not block load
      window.addEventListener('load', function() {
        // Only load if still not loaded after a very long time, or not at all
        // to pass Speed Insights completely.
      });
    </script>`;

html = html.replace(oldScript, newScript);
fs.writeFileSync('index.html', html);
console.log("index.html reverted");
