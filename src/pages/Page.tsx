import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import SEO from '../components/SEO';

export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    
    setLoading(true);
    fetch(`/api/pages/${slug}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Page not found');
        return res.json();
      })
      .then(data => {
        setPage(data);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setPage(null);
          setLoading(false);
        }
      });
      
    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!page) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <SEO 
        title={page.title} 
        description={`Lisez notre page sur ${page.title} sur ZORANDO.`}
      />
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 px-4">
          {page.title}
        </h1>
        <div 
          className="prose prose-orange max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
        />
      </div>
    </div>
  );
}
