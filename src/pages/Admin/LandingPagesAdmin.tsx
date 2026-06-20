import React, { useState, useEffect } from 'react';
import { Eye, Plus, CheckCircle2, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPagesAdmin() {
  const [products, setProducts] = useState<any[]>([]);
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [editingPage, setEditingPage] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const prRes = await fetch('/api/products?limit=100'); // Note: Added limit=100 to get more products
      if (prRes.ok) {
        const prData = await prRes.json();
        setProducts(prData.products || prData);
      }
      const lpRes = await fetch('/api/admin/landing-pages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (lpRes.ok) {
        setLandingPages(await lpRes.json());
      }
    } catch (err) {
      toast.error('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createLandingPage = async () => {
    if (!selectedProductId) return toast.error("Veuillez sélectionner un produit");
    
    let productsArray = Array.isArray(products) ? products : products.products || [];
    const product = productsArray.find((p: any) => p.id.toString() === selectedProductId);
    if (!product) return;

    const slug = customSlug.trim() || `promo-${product.slug}`;

    try {
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          product_id: product.id,
          slug,
          config: {
            theme: 'light',
            hero_title: `Découvrez ${product.name}`,
            hero_subtitle: "L'offre exclusive avec livraison rapide",
            show_faq: true,
            show_reviews: true,
            show_features: true
          }
        })
      });

      if (res.ok) {
        toast.success("Landing page créée avec succès");
        setCustomSlug('');
        setSelectedProductId('');
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Erreur: ${errorData.error || 'Impossible de créer la page'}`);
      }
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  const deleteLandingPage = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette landing page ?")) return;
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        toast.success("Landing page supprimée");
        fetchData();
      }
    } catch (err) {
      toast.error("Erreur de suppression");
    }
  };

  const saveEdit = async () => {
    if (!editingPage) return;
    try {
      const res = await fetch(`/api/admin/landing-pages/${editingPage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          product_id: editingPage.product_id,
          slug: editingPage.slug,
          config: editingPage.config
        })
      });
      if (res.ok) {
        toast.success("Modifications enregistrées");
        setEditingPage(null);
        fetchData();
      } else {
        toast.error("Erreur lors de la modification");
      }
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  let productsArray = Array.isArray(products) ? products : (products as any).products || [];

  return (
    <div className="space-y-8">
      {/* Create Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Générer une Landing Page</h2>
          <p className="text-sm text-gray-500 mt-1">Créez automatiquement une landing page experte et focalisée sur la conversion (Meta Ads, TikTok) pour n'importe quel produit.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionnez un produit</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">-- Choisir un produit --</option>
              {productsArray.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">URL personnalisée (Optionnel)</label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-sm text-gray-500">/landing/</span>
              <input 
                type="text" 
                placeholder="ex: promo-exclusive"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="w-full border border-gray-300 rounded-r-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          <button 
            onClick={createLandingPage}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 w-full md:w-auto h-10"
          >
            <Plus size={18} /> Générer
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Vos Landing Pages Actives</h2>
            <p className="text-sm text-gray-500 mt-1">Gérez vos pages de ventes indépendantes</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : landingPages.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg text-gray-500 border border-dashed border-gray-200">
            Aucune landing page créée pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium rounded-l-lg">Produit concerné</th>
                  <th className="p-4 font-medium">Lien URL</th>
                  <th className="p-4 font-medium">Date de création</th>
                  <th className="p-4 font-medium text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {landingPages.map(page => (
                  <tr key={page.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {page.product_image ? (
                          <img src={page.product_image} alt={page.product_name} className="w-10 h-10 object-cover rounded-md border" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-md border flex items-center justify-center text-gray-400">IMG</div>
                        )}
                        <span className="font-medium text-gray-800 max-w-xs truncate">{page.product_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <a href={`/landing/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm bg-blue-50 px-3 py-1.5 rounded-full w-max border border-blue-100">
                        /landing/{page.slug} <Eye size={14} />
                      </a>
                    </td>
                    <td className="p-4 text-sm text-gray-500 font-mono">
                      {new Date(page.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                       <button 
                        onClick={() => setEditingPage(page)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Modifier la config">
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => deleteLandingPage(page.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100" title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Modifier la Landing Page</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                <input 
                  type="text" 
                  value={editingPage.slug} 
                  onChange={e => setEditingPage({...editingPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titre de couverture</label>
                <input 
                  type="text" 
                  value={editingPage.config?.hero_title || ''} 
                  onChange={e => setEditingPage({...editingPage, config: {...editingPage.config, hero_title: e.target.value}})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sous-titre / Description</label>
                <textarea 
                  value={editingPage.config?.hero_subtitle || ''} 
                  onChange={e => setEditingPage({...editingPage, config: {...editingPage.config, hero_subtitle: e.target.value}})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={3}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titre SEO (Optionnel)</label>
                <input 
                  type="text" 
                  value={editingPage.config?.seo_title || ''} 
                  onChange={e => setEditingPage({...editingPage, config: {...editingPage.config, seo_title: e.target.value}})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingPage(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Annuler</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
