import React, { useState, useEffect } from 'react';
import { Eye, Copy, Trash2, CheckCircle2, AlertCircle, Plus, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPagesAdmin() {
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lpRes, prRes] = await Promise.all([
        fetch('/api/admin/landing-pages', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        }),
        fetch('/api/products')
      ]);

      if (lpRes.ok) {
        const lpData = await lpRes.json();
        setLandingPages(lpData);
      }
      
      if (prRes.ok) {
        const prData = await prRes.json();
        setProducts(prData);
      }
    } catch (err) {
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const createLandingPage = async () => {
    if (!selectedProduct) {
      toast.error('Sélectionnez un produit');
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ product_id: selectedProduct })
      });

      if (res.ok) {
        toast.success('Landing page générée avec succès');
        fetchData();
        setSelectedProduct('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erreur lors de la création');
      }
    } catch (err) {
      toast.error('Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteLandingPage = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette landing page ?')) return;

    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (res.ok) {
        toast.success('Supprimé avec succès');
        setLandingPages(landingPages.filter(lp => lp.id !== id));
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/landing/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Lien copié !');
  };

  const startEditing = (lp: any) => {
    setEditingPage(lp);
    setEditForm({
      slug: lp.slug,
      seo_title: lp.seo_title || '',
      seo_description: lp.seo_description || '',
      hero_image: lp.config?.hero_image || '',
      lifestyle_image_1: lp.config?.lifestyle_image_1 || '',
      lifestyle_image_2: lp.config?.lifestyle_image_2 || '',
      lifestyle_image_3: lp.config?.lifestyle_image_3 || '',
      before_after_image: lp.config?.before_after_image || '',
      promo_banner_image: lp.config?.promo_banner_image || '',
      ugc_video_1: lp.config?.ugc_video_1 || '',
      ugc_video_2: lp.config?.ugc_video_2 || '',
      ugc_video_3: lp.config?.ugc_video_3 || ''
    });
  };

  const saveEdit = async () => {
    try {
      setIsSaving(true);
      const updatedConfig = {
        ...(editingPage.config || {}),
        hero_image: editForm.hero_image,
        lifestyle_image_1: editForm.lifestyle_image_1,
        lifestyle_image_2: editForm.lifestyle_image_2,
        lifestyle_image_3: editForm.lifestyle_image_3,
        before_after_image: editForm.before_after_image,
        promo_banner_image: editForm.promo_banner_image,
        ugc_video_1: editForm.ugc_video_1,
        ugc_video_2: editForm.ugc_video_2,
        ugc_video_3: editForm.ugc_video_3
      };

      const res = await fetch(`/api/admin/landing-pages/${editingPage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          slug: editForm.slug,
          seo_title: editForm.seo_title,
          seo_description: editForm.seo_description,
          config: updatedConfig
        })
      });

      if (res.ok) {
        toast.success('Landing page modifiée');
        setEditingPage(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur lors de la modification');
      }
    } catch (err) {
      toast.error('Erreur réseau');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Landing Pages</h2>
          <p className="text-sm text-gray-500 mt-1">Générez des pages de vente ultra-optimisées pour vos produits</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="flex-1 md:w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Sélectionner un produit...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={createLandingPage}
            disabled={isCreating || !selectedProduct}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {isCreating ? <AlertCircle className="animate-spin" size={20} /> : <Plus size={20} />}
            Créer
          </button>
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-gray-500">Produit</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500">URL / Slug</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500">Créé le</th>
              <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : landingPages.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Aucune landing page créée.
                </td>
              </tr>
            ) : (
              landingPages.map((lp) => (
                <tr key={lp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {lp.product_image && (
                        <img src={lp.product_image} alt="" className="w-10 h-10 rounded object-cover border" />
                      )}
                      <span className="font-medium text-gray-900">{lp.product_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-mono text-sm">/landing/{lp.slug}</span>
                      <button onClick={() => copyLink(lp.slug)} className="text-gray-400 hover:text-orange-500" title="Copier le lien">
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(lp.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/landing/${lp.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Voir la page"
                      >
                        <Eye size={20} />
                      </a>
                      <button 
                        onClick={() => startEditing(lp)}
                        className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                        title="Modifier les images et paramétrages marketing"
                      >
                        <Edit size={20} />
                      </button>
                      <button 
                        onClick={() => deleteLandingPage(lp.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editingPage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">Options Marketing - {editingPage.product_name}</h3>
              <button onClick={() => setEditingPage(null)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SLUG ET SEO */}
              <div className="col-span-1 md:col-span-2 space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2">Paramètres de la page</h4>
                <div>
                  <label className="block text-sm font-medium mb-1">URL (Slug)</label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({...editForm, slug: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={editForm.seo_title}
                      onChange={(e) => setEditForm({...editForm, seo_title: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SEO Description</label>
                    <input
                      type="text"
                      value={editForm.seo_description}
                      onChange={(e) => setEditForm({...editForm, seo_description: e.target.value})}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* IMAGES MARKETING */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2">Images Marketing (URLs)</h4>
                <div>
                  <label className="block text-sm font-medium mb-1">Image Hero Principale</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.hero_image}
                    onChange={(e) => setEditForm({...editForm, hero_image: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Image plein écran en haut de la page.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image Lifestyle 1</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.lifestyle_image_1}
                    onChange={(e) => setEditForm({...editForm, lifestyle_image_1: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image Lifestyle 2</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.lifestyle_image_2}
                    onChange={(e) => setEditForm({...editForm, lifestyle_image_2: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image Lifestyle 3 (Bannière milieu)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.lifestyle_image_3}
                    onChange={(e) => setEditForm({...editForm, lifestyle_image_3: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* AUTRES MEDIAS MARKETING */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2">Vidéos UGC & Promo (URLs)</h4>
                <div>
                  <label className="block text-sm font-medium mb-1">Image Avant/Après</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.before_after_image}
                    onChange={(e) => setEditForm({...editForm, before_after_image: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bannière Promo Spéciale</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.promo_banner_image}
                    onChange={(e) => setEditForm({...editForm, promo_banner_image: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vidéo UGC 1 (.mp4, .webm, ou Image)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.ugc_video_1}
                    onChange={(e) => setEditForm({...editForm, ugc_video_1: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vidéo UGC 2</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.ugc_video_2}
                    onChange={(e) => setEditForm({...editForm, ugc_video_2: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vidéo UGC 3</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editForm.ugc_video_3}
                    onChange={(e) => setEditForm({...editForm, ugc_video_3: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingPage(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={saveEdit}
                disabled={isSaving}
                className="px-6 py-2 bg-black text-white hover:bg-gray-900 rounded-lg transition-colors flex items-center gap-2"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
