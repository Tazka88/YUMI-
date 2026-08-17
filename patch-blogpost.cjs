const fs = require('fs');
let code = fs.readFileSync('src/pages/Blog/BlogPost.tsx', 'utf8');

// replace Helmet import with SEO
code = code.replace("import { Helmet } from 'react-helmet-async';", "import SEO from '../../components/SEO';");

// replace Helmet block with SEO component
const helmetRegex = /\{\/\* SEO Meta Tags \*\/\}\s*<Helmet>[\s\S]*?<\/Helmet>/;

const seoReplacement = `      {/* SEO Meta Tags */}
      <SEO
        title={post.seo_title || post.title || 'Blog ZORANDO'}
        description={post.seo_description || post.excerpt || ''}
        image={post.main_image || post.image_url}
        type="article"
        url={window.location.href}
        schema={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.seo_title || post.title,
          "image": (post.main_image || post.image_url) ? [(post.main_image || post.image_url)] : [],
          "datePublished": post.published_at || post.created_at,
          "dateModified": post.updated_at || post.created_at,
          "author": [{
              "@type": "Organization",
              "name": "ZORANDO",
              "url": "https://www.zorando.com"
          }],
          "publisher": {
            "@type": "Organization",
            "name": "ZORANDO",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.zorando.com/logo.png"
            }
          },
          "description": post.seo_description || post.excerpt
        }}
      />`;

code = code.replace(helmetRegex, seoReplacement);

fs.writeFileSync('src/pages/Blog/BlogPost.tsx', code);
