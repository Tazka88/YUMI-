import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Calendar, ChevronRight } from 'lucide-react';

export default function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/blog/categories`);
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('page', currentPage.toString());
      if (searchQuery) qs.set('search', searchQuery);
      if (categoryFilter) qs.set('category', categoryFilter);

      const res = await fetch(`/api/blog/posts?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q')?.toString() || '';
    if (q) searchParams.set('q', q);
    else searchParams.delete('q');
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const setCategory = (slug: string) => {
    if (slug) searchParams.set('category', slug);
    else searchParams.delete('category');
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const totalPages = Math.ceil(totalCount / 10);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Blog | ZORANDO</title>
        <meta name="description" content="Découvrez nos derniers articles, guides et conseils sur ZORANDO." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            Notre Blog
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Astuces, guides d'achat et actualités pour vous accompagner.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {posts.map(post => (
                  <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                    <Link to={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden">
                      {post.image_url ? (
                         <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                         <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                           <Search className="w-8 h-8 text-gray-300" />
                         </div>
                      )}
                      {post.category_name && (
                        <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                          {post.category_name}
                        </div>
                      )}
                    </Link>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Calendar size={16} className="mr-2" />
                        {new Date(post.published_at || post.created_at).toLocaleDateString('fr-FR')}
                      </div>
                      <Link to={`/blog/${post.slug}`} className="block block group-hover:text-orange-500 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                          {post.title}
                        </h2>
                      </Link>
                      <p className="text-gray-600 mb-6 line-clamp-3 flex-1 flex-grow">
                        {post.excerpt}
                      </p>
                      <Link to={`/blog/${post.slug}`} className="inline-flex items-center text-orange-500 font-medium group-hover:text-orange-600 transition-colors mt-auto">
                        Lire l'article <ChevronRight size={16} className="ml-1" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
                <p className="text-gray-500 text-lg">Aucun article trouvé.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => {
                        searchParams.set('page', page.toString());
                        setSearchParams(searchParams);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${page === currentPage ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recherche</h3>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Rechercher un article..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Catégories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setCategory('')}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${!categoryFilter ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Toutes les catégories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${categoryFilter === cat.slug ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
