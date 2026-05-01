import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  schema?: any;
}

export default function SEO({ title, description, image, url, schema }: SEOProps) {
  const siteName = 'ZORANDO';
  const fullTitle = `${title} | ${siteName}`;
  const defaultImage = 'https://zorando.com/og-image-fb.jpg';
  const finalImage = image || defaultImage;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalImage} />
      {url && <meta property="og:url" content={url} />}
      <link rel="canonical" href={url || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '')} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={finalImage} />
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
