import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus, X, Search, Check, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BlogAdmin() {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` };
      const [resPosts, resCats] = await Promise.all([
        fetch(`/api/admin/blog/posts`, { headers }),
        fetch(`/api/admin/blog/categories`, { headers })
      ]);
      if (resPosts.ok) setPosts(await resPosts.json());
      if (resCats.ok) setCategories(await resCats.json());
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
        body: formData
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEditingPost({ ...editingPost, image_url: data.url });
      toast.success('Image téléchargée');
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingPost.id;
      const url = `/api/admin/blog/posts${isEdit ? `/${editingPost.id}` : ''}`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(editingPost)
      });
      
      if (!res.ok) throw new Error();
      
      toast.success(isEdit ? 'Article modifié' : 'Article créé');
      setEditingPost(null);
      fetchData();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    try {
        const res = await fetch(`/api/admin/blog/posts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) throw new Error();
        toast.success('Article supprimé');
        fetchData();
    } catch {
        toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingCategory.id;
      if (isEdit) { toast.error('Non supporté, supprimez et recréez'); return; }
      
      const res = await fetch(`/api/admin/blog/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(editingCategory)
      });
      
      if (!res.ok) throw new Error();
      
      toast.success('Catégorie créée');
      setEditingCategory(null);
      fetchData();
    } catch {
      toast.error('Erreur');
    }
  };
  
  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Supprimer cette catégorie ? Les articles associés n\'auront plus de catégorie.')) return;
    try {
        const res = await fetch(`/api/admin/blog/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) throw new Error();
        toast.success('Catégorie supprimée');
        fetchData();
    } catch {
        toast.error('Erreur lors de la suppression');
    }
  };

  const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
        <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 font-medium rounded-lg text-sm transition-colors ${activeTab === 'posts' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Articles
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 font-medium rounded-lg text-sm transition-colors ${activeTab === 'categories' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Catégories
            </button>
        </div>
        <div>
           {activeTab === 'posts' ? (
                <button
                onClick={() => setEditingPost({ status: 'draft' })}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus size={20} className="mr-2" /> Nouvel article
              </button>
           ) : (
                <button
                onClick={() => setEditingCategory({ name: '', slug: '' })}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus size={20} className="mr-2" /> Nouvelle catégorie
              </button>
           )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div></div>
        ) : activeTab === 'posts' ? (
          <div>
            <div className="mb-6 relative">
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="p-4 font-semibold text-gray-600 text-sm w-16">Image</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Titre</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm w-32">Catégorie</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm w-32">Statut</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map(post => (
                    <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4">
                          {post.image_url ? (
                              <img src={post.image_url} alt="" className="w-12 h-12 object-cover rounded shadow-sm border border-gray-200" />
                          ) : <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-xs">Vide</div>}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 line-clamp-1">{post.title}</div>
                        <div className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{post.category_name || '-'}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {post.status === 'published' ? 'Publié' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => setEditingPost(post)} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded"><Pencil size={18} /></button>
                        <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredPosts.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-500">Aucun article.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
             <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="p-4 font-semibold text-gray-600 text-sm">Nom</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm">Slug</th>
                    <th className="p-4 font-semibold text-gray-600 text-sm w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4 font-medium">{cat.name}</td>
                      <td className="p-4 text-sm text-gray-500">{cat.slug}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                      <tr><td colSpan={3} className="p-8 text-center text-gray-500">Aucune catégorie.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
        )}
      </div>

      {/* Editor Modal for Posts */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start overflow-y-auto pt-10 pb-10 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{editingPost.id ? 'Modifier l\'article' : 'Nouvel article'}</h2>
              <button type="button" onClick={() => setEditingPost(null)} className="text-gray-400 hover:text-gray-600 bg-white shadow-sm p-1.5 rounded-full border border-gray-200 transition"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSavePost} className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'article *</label>
                        <input required type="text" className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-orange-500 text-lg font-medium" value={editingPost.title || ''} onChange={(e) => {
                            const val = e.target.value;
                            setEditingPost({ ...editingPost, title: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });
                        }} placeholder="Saisir le titre ici..." />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contenu (HTML)</label>
                        <textarea rows={16} className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-orange-500 font-mono text-sm leading-relaxed" value={editingPost.content || ''} onChange={(e) => setEditingPost({...editingPost, content: e.target.value})} placeholder="<h1>Titre</h1><p>Contenu libre...</p>" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Résumé (Excerpt)</label>
                        <textarea rows={3} className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-orange-500 text-sm" value={editingPost.excerpt || ''} onChange={(e) => setEditingPost({...editingPost, excerpt: e.target.value})} placeholder="Un court texte d'accroche..." />
                    </div>
                 </div>

                 <div className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Informations</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select className="w-full border-gray-300 rounded-lg p-2.5 border bg-white focus:ring-2 focus:ring-orange-500" value={editingPost.status || 'draft'} onChange={(e) => setEditingPost({...editingPost, status: e.target.value})}>
                            <option value="draft">Brouillon</option>
                            <option value="published">Publié</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                        <select className="w-full border-gray-300 rounded-lg p-2.5 border bg-white focus:ring-2 focus:ring-orange-500" value={editingPost.category_id || ''} onChange={(e) => setEditingPost({...editingPost, category_id: e.target.value ? parseInt(e.target.value) : null})}>
                            <option value="">Aucune</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image de l'article</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <input type="text" className="flex-1 border-gray-300 rounded-lg p-2.5 border text-sm" value={editingPost.image_url || ''} onChange={(e) => setEditingPost({...editingPost, image_url: e.target.value})} placeholder="https://..." />
                              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 flex items-center justify-center transition">
                                {uploading ? <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> : <Upload size={18} />}
                              </button>
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>
                            {editingPost.image_url && (
                                <img src={editingPost.image_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
                            )}
                        </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-gray-200 space-y-4">
                        <h4 className="font-semibold text-sm text-gray-900">SEO (Référencement)</h4>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">SEO Slug</label>
                            <input type="text" className="w-full border-gray-300 rounded p-2 border font-mono text-xs focus:ring-1 focus:ring-orange-500 bg-white" value={editingPost.slug || ''} onChange={(e) => setEditingPost({...editingPost, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Meta Title</label>
                            <input type="text" className="w-full border-gray-300 rounded p-2 border text-xs focus:ring-1 focus:ring-orange-500 bg-white" value={editingPost.seo_title || ''} onChange={(e) => setEditingPost({...editingPost, seo_title: e.target.value})} placeholder="60 caractères max" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Meta Description</label>
                            <textarea rows={3} className="w-full border-gray-300 rounded p-2 border text-xs focus:ring-1 focus:ring-orange-500 bg-white" value={editingPost.seo_description || ''} onChange={(e) => setEditingPost({...editingPost, seo_description: e.target.value})} placeholder="150 caractères max" />
                        </div>
                    </div>
                 </div>
              </div>

              {/* Sticky bottom save bar inner wrapper */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end shrink-0">
                <button type="button" onClick={() => setEditingPost(null)} className="mr-4 px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Annuler</button>
                <button type="submit" className="px-6 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition shadow-md flex items-center">
                    <Save size={18} className="mr-2" /> Enregistrer l'article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editor Modal for Category */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Nouvelle catégorie</h2>
              <button type="button" onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-gray-600 bg-white shadow-sm p-1.5 rounded-full border border-gray-200 transition"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-6">
               <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input required type="text" className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-orange-500" value={editingCategory.name || ''} onChange={(e) => {
                          const val = e.target.value;
                          setEditingCategory({ ...editingCategory, name: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });
                      }} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                      <input required type="text" className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-orange-500" value={editingCategory.slug || ''} onChange={(e) => setEditingCategory({...editingCategory, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
                  </div>
               </div>
              <div className="mt-8 pt-4 flex justify-end">
                <button type="button" onClick={() => setEditingCategory(null)} className="mr-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center font-medium shadow-sm"><Check size={18} className="mr-2" /> Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
