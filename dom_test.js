const { JSDOM } = require('jsdom');
const html = `<!doctype html>
<html>
  <head>
    <title data-rh="true">Test</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="application/ld+json" data-rh="true">{"@type":"Product","name":"Server"}</script>
  </body>
</html>`;
const dom = new JSDOM(html);
const document = dom.window.document;
console.log("Body scripts:", document.querySelectorAll('body script[type="application/ld+json"]').length);
console.log("Head scripts:", document.querySelectorAll('head script[type="application/ld+json"]').length);
