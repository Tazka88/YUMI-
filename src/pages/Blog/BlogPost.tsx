import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { buildBlogSchema, buildBreadcrumbSchema } from '../../lib/schemaUtils';
import { Calendar, Tag, ChevronRight, Facebook, Twitter, Linkedin, Share2 } from 'lucide-react';
import DOMPurify from 'dompurify';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/posts/${slug}`);
      if (res.ok) {
        setPost(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Article introuvable</h1>
        <p className="text-gray-500 mb-8">Cet article n'existe pas ou a été supprimé.</p>
        <Link to="/blog" className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
          Retour au blog
        </Link>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href.replace(/^https?:\/\/(www\.)?[^\/]+/, 'https://www.zorando.com') : '';
  const dateStr = post.published_at ? new Date(post.published_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '';

  const getProcessedContent = (content: string, post: any) => {
    if (!content) return '';
    
    let cleanContent = DOMPurify.sanitize(content);
    
    const img1 = post.image_1_url ? `<div class="my-8"><img src="${post.image_1_url.replace(/"/g, '&quot;')}" alt="${(post.image_1_alt || post.title).replace(/"/g, '&quot;')}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : '';
    const img2 = post.image_2_url ? `<div class="my-8"><img src="${post.image_2_url.replace(/"/g, '&quot;')}" alt="${(post.image_2_alt || post.title).replace(/"/g, '&quot;')}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : '';
    const img3 = post.image_3_url ? `<div class="my-8"><img src="${post.image_3_url.replace(/"/g, '&quot;')}" alt="${(post.image_3_alt || post.title).replace(/"/g, '&quot;')}" loading="lazy" class="w-full rounded-2xl shadow-lg object-cover" /></div>` : '';
    
    if (!img1 && !img2 && !img3) return cleanContent;

    const pTags = cleanContent.split('</p>');
    if (pTags.length <= 2) {
      return cleanContent + img1 + img2 + img3;
    }

    const pos1 = 1;
    const pos2 = Math.max(2, Math.floor(pTags.length / 2));
    const pos3 = Math.max(pos2 + 1, pTags.length - 2);
    
    let result = '';
    for (let i = 0; i < pTags.length; i++) {
      result += pTags[i] + (i < pTags.length - 1 ? '</p>' : '');
      
      if (i === pos1 - 1 && img1) result += img1;
      if (i === pos2 - 1 && img2) result += img2;
      if (i === pos3 - 1 && img3) result += img3;
    }
    
    return result;
  };


  return (
    <article className="min-h-screen bg-white">
            {/* SEO Meta Tags */}
      <SEO
        title={post.seo_title || post.title || 'Blog ZORANDO'}
        description={post.seo_description || post.excerpt || ''}
        image={post.main_image || post.image_url}
        type="article"
        url={window.location.href}
        schema={[
          buildBlogSchema(post, window.location.href, 'https://www.zorando.com'),
          buildBreadcrumbSchema([
            { name: 'Accueil', item: 'https://www.zorando.com/' },
            { name: 'Blog', item: 'https://www.zorando.com/blog' },
            { name: post.title, item: window.location.href }
          ])
        ]}
      />

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {post.image_url && (
          <div className="absolute inset-0 z-0">
            <img src={post.image_url} alt={post.main_image_alt || post.title} className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white"></div>
          </div>
        )}
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm font-medium text-orange-600 mb-6 uppercase tracking-wider">
            {post.category_name && (
              <Link to={`/blog?category=${post.category_slug}`} className="hover:text-orange-700 transition-colors">
                {post.category_name}
              </Link>
            )}
            {post.category_name && dateStr && <span>•</span>}
            {dateStr && <span>{dateStr}</span>}
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Main image */}
      {post.image_url && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 lg:-mt-16 relative z-20 mb-16">
          <img 
            src={post.image_url} 
            alt={post.main_image_alt || post.title} 
            className="w-full h-auto rounded-2xl shadow-xl object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 prose prose-emerald prose-lg">
         <div dangerouslySetInnerHTML={{ __html: getProcessedContent(post.content, post) }} />
      </div>

      {/* Social Share */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100 flex flex-col items-center">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Share2 className="mr-2" size={20} /> Partager cet article
        </h3>
        <div className="flex gap-4">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-blue-500 hover:text-white transition-colors"
          >
            <Facebook size={20} />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-sky-500 hover:text-white transition-colors"
          >
            <Twitter size={20} />
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-50 text-gray-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
          >
            <Linkedin size={20} />
          </a>
        </div>
      </div>

      {/* Related Posts */}
      {post.related && post.related.length > 0 && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Articles sur le même sujet</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {post.related.map((rp: any) => (
                <article key={rp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  <Link to={`/blog/${rp.slug}`} className="block relative aspect-video overflow-hidden bg-gray-100">
                    {rp.image_url && (
                        <img src={rp.image_url} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </Link>
                  <div className="p-6 flex-1 flex flex-col">
                    <Link to={`/blog/${rp.slug}`} className="block block group-hover:text-orange-500 transition-colors">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                        {rp.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1 flex-grow">
                      {rp.excerpt}
                    </p>
                    <Link to={`/blog/${rp.slug}`} className="inline-flex items-center text-orange-500 text-sm font-medium group-hover:text-orange-600 transition-colors mt-auto">
                      Lire la suite <ChevronRight size={14} className="ml-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
