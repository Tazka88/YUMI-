const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldScript = html.substring(
  html.indexOf('<!-- Google tag (gtag.js) - Lazy loaded on interaction -->'),
  html.indexOf('</script>', html.indexOf('<!-- Google tag (gtag.js) - Lazy loaded on interaction -->')) + 9
);

const newScript = `<!-- Google tag (gtag.js) - Lazy loaded on interaction & Consent Mode -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      
      // Consent Mode V2 par défaut
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
      
      gtag('js', new Date());

      function loadGTM() {
        if (window.gtmLoaded) return;
        window.gtmLoaded = true;
        
        var script = document.createElement('script');
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-7JLYM1QX3C'; 
        script.async = true;
        document.head.appendChild(script);

        ['scroll','mousemove','touchstart','click','keydown'].forEach(function(evt) {
          window.removeEventListener(evt, loadGTM);
        });
      }

      window.loadGTM = loadGTM; // Rend la fonction globale pour la CookieBanner

      ['scroll','mousemove','touchstart','click','keydown'].forEach(function(evt) {
        window.addEventListener(evt, loadGTM, { passive: true, once: true });
      });

      window.addEventListener('load', function() {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(function() { setTimeout(loadGTM, 2500); });
        } else {
          setTimeout(loadGTM, 2500);
        }
      });
    </script>`;

html = html.replace(oldScript, newScript);
fs.writeFileSync('index.html', html);
console.log("index.html updated");
