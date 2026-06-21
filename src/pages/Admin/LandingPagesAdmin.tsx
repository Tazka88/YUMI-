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
    
    const product = products.find((p: any) => p.id.toString() === selectedProductId);
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
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">URL personnalisée (Optionnel)</label>
            <div className="flex items-center">
              <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-sm text-gray-500">/lp/</span>
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
                      <a href={`/lp/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm bg-blue-50 px-3 py-1.5 rounded-full w-max border border-blue-100">
                        /lp/{page.slug} <Eye size={14} />
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
        <div className="fixed inset-0 bg-black/50 flex flex-col p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-xl shadow-xl flex flex-col w-full max-w-5xl mx-auto h-full max-h-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">Modifier la Landing Page</h3>
              <button onClick={() => setEditingPage(null)} className="text-gray-500 hover:text-gray-800">Fermer</button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-gray-50 flex gap-6">
              {/* Colonne Principale */}
              <div className="flex-1 space-y-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
                  <h4 className="font-bold text-gray-800 border-b pb-2">Informations Générales</h4>
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
                    <label className="block text-sm font-medium mb-1">Titre SEO</label>
                    <input 
                      type="text" 
                      value={editingPage.config?.seo_title || ''} 
                      onChange={e => setEditingPage({...editingPage, config: {...editingPage.config, seo_title: e.target.value}})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 items-start">
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Structure Libre (Blocs)</h4>
                    
                    <div className="space-y-4">
                      {(editingPage.config?.blocks || []).map((block: any, idx: number) => (
                        <div key={block.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button 
                              onClick={() => {
                                const newBlocks = [...(editingPage.config.blocks || [])];
                                newBlocks.splice(idx, 1);
                                setEditingPage({...editingPage, config: {...editingPage.config, blocks: newBlocks}});
                              }}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">{block.type}</div>
                          
                          {block.type === 'hero' && (
                            <div className="space-y-3">
                              <input type="text" placeholder="Titre principal" value={block.content?.title || ''} onChange={(e) => {
                                const newBlocks = [...editingPage.config.blocks];
                                newBlocks[idx].content = { ...newBlocks[idx].content, title: e.target.value };
                                setEditingPage({...editingPage, config: {...editingPage.config, blocks: newBlocks}});
                              }} className="w-full border p-2 rounded" />
                              <textarea placeholder="Sous-titre" value={block.content?.subtitle || ''} onChange={(e) => {
                                const newBlocks = [...editingPage.config.blocks];
                                newBlocks[idx].content = { ...newBlocks[idx].content, subtitle: e.target.value };
                                setEditingPage({...editingPage, config: {...editingPage.config, blocks: newBlocks}});
                              }} className="w-full border p-2 rounded" rows={2}></textarea>
                            </div>
                          )}

                          {block.type === 'youtube' && (
                            <div className="space-y-3">
                              <input type="text" placeholder="URL YouTube (ex: https://youtu.be/xxx)" value={block.content?.url || ''} onChange={(e) => {
                                const newBlocks = [...editingPage.config.blocks];
                                newBlocks[idx].content = { ...newBlocks[idx].content, url: e.target.value };
                                setEditingPage({...editingPage, config: {...editingPage.config, blocks: newBlocks}});
                              }} className="w-full border p-2 rounded" />
                            </div>
                          )}

                          {block.type === 'text' && (
                            <div className="space-y-3">
                              <textarea placeholder="Contenu textuel" value={block.content?.text || ''} onChange={(e) => {
                                const newBlocks = [...editingPage.config.blocks];
                                newBlocks[idx].content = { ...newBlocks[idx].content, text: e.target.value };
                                setEditingPage({...editingPage, config: {...editingPage.config, blocks: newBlocks}});
                              }} className="w-full border p-2 rounded" rows={4}></textarea>
                            </div>
                          )}

                          {block.type === 'image' && (
                            <div className="space-y-3">
                              <input type="text" placeholder="URL de l'image" value={block.content?.url || ''} onChange={(e) => {
                                const newBlocks = [...editingPage.config.blocks];
                                newBlocks[idx].content = { ...newBlocks[idx].content, url: e.target.value };
                                setEditingPage({...editingPage, config: {...editingPage.config, blocks: newBlocks}});
                              }} className="w-full border p-2 rounded" />
                            </div>
                          )}
                        </div>
                      ))}

                      {(!editingPage.config?.blocks || editingPage.config.blocks.length === 0) && (
                        <p className="text-gray-500 text-sm italic">Aucun bloc dans la structure libre. La landing page utilisera le template par défaut.</p>
                      )}
                    </div>

                    <div className="mt-6 border-t pt-4">
                      <label className="text-sm font-bold text-gray-700 block mb-2">Ajouter un bloc :</label>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => {
                          setEditingPage({...editingPage, config: {...editingPage.config, blocks: [...(editingPage.config?.blocks || []), { id: Date.now(), type: 'hero', content: {} }]}});
                        }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border rounded text-sm">+ Hero Header</button>
                        <button onClick={() => {
                          setEditingPage({...editingPage, config: {...editingPage.config, blocks: [...(editingPage.config?.blocks || []), { id: Date.now(), type: 'youtube', content: {} }]}});
                        }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border rounded text-sm">+ Vidéo YouTube</button>
                        <button onClick={() => {
                          setEditingPage({...editingPage, config: {...editingPage.config, blocks: [...(editingPage.config?.blocks || []), { id: Date.now(), type: 'text', content: {} }]}});
                        }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border rounded text-sm">+ Texte Libre</button>
                        <button onClick={() => {
                          setEditingPage({...editingPage, config: {...editingPage.config, blocks: [...(editingPage.config?.blocks || []), { id: Date.now(), type: 'image', content: {} }]}});
                        }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border rounded text-sm">+ Image</button>
                        <button onClick={() => {
                          setEditingPage({...editingPage, config: {...editingPage.config, blocks: [...(editingPage.config?.blocks || []), { id: Date.now(), type: 'reviews', content: {} }]}});
                        }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border rounded text-sm">+ Avis Clients</button>
                        <button onClick={() => {
                          setEditingPage({...editingPage, config: {...editingPage.config, blocks: [...(editingPage.config?.blocks || []), { id: Date.now(), type: 'faq', content: {} }]}});
                        }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border rounded text-sm">+ FAQ (Auto)</button>
                        <button onClick={() => {
                          setEditingPage({...editingPage, config: {...editingPage.config, blocks: [...(editingPage.config?.blocks || []), { id: Date.now(), type: 'cta', content: {} }]}});
                        }} className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200 rounded text-sm font-bold">+ Bouton Commander</button>
                      </div>
                    </div>
                </div>
              </div>

              {/* Colonne Latérale */}
              <div className="w-80 space-y-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                   <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Statut de la page</h4>
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input 
                      type="checkbox" 
                      className="w-5 h-5 form-checkbox text-orange-500 rounded border-gray-300"
                      checked={editingPage.config?.is_published !== false}
                      onChange={(e) => setEditingPage({...editingPage, config: {...editingPage.config, is_published: e.target.checked}})}
                     />
                     <span className="font-medium text-gray-700">Publié (En ligne)</span>
                   </label>
                </div>
                
                <div className="bg-white p-5 rounded-xl text-sm shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-2 border-b pb-2">Astuces</h4>
                  <ul className="list-disc pl-4 space-y-2 text-gray-600">
                    <li>Utilisez le bloc <strong>Bouton Commander</strong> pour ouvrir automatiquement le formulaire d'achat optimisé sans redirection.</li>
                    <li>Les blocs <strong>Avis Clients</strong> et <strong>FAQ</strong> se remplissent automatiquement avec les données du produit rattaché !</li>
                    <li>S'il n'y a <strong>aucun bloc</strong>, le design premium par défaut sera affiché.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 bg-white">
              <button onClick={() => setEditingPage(null)} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Annuler</button>
              <button onClick={saveEdit} className="px-6 py-2.5 bg-orange-500 font-bold text-white rounded-lg hover:bg-orange-600 shadow-sm flex items-center gap-2">
                <CheckCircle2 size={18} /> Enregistrer la page
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
