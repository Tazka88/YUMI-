import React, { useState, useEffect } from 'react';
import { Eye, Copy, Trash2, CheckCircle2, AlertCircle, Plus, Edit, X, Upload, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export function SmartProductSearch({ products, value, onChange, placeholder, valueKey = "slug", className = "w-80" }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProduct = products.find((p: any) => String(p[valueKey]) === String(value));

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white cursor-text flex items-center justify-between shadow-sm transition-all focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <Search size={16} className="text-gray-400 shrink-0" />
          {isOpen ? (
            <input
              type="text"
              className="w-full outline-none text-gray-900 bg-transparent"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          ) : (
            <span className={`truncate ${selectedProduct ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {selectedProduct ? selectedProduct.name : placeholder}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 flex flex-col items-center justify-center">
              <Search size={24} className="text-gray-300 mb-2" />
              Aucun produit ne correspond
            </div>
          ) : (
            filteredProducts.map((p: any) => (
              <div
                key={p.id}
                className="px-4 py-3 text-sm text-gray-800 hover:bg-orange-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                onClick={() => {
                  onChange(p[valueKey]);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
              >
                <img src={p.images?.[0] || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-md object-cover border border-gray-100 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate text-gray-900">{p.name}</span>
                  <span className="text-xs text-gray-500 truncate">/{p.slug}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function LandingPagesAdmin() {
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [oneBladeSlug, setOneBladeSlug] = useState('');
  const [newLpProductId, setNewLpProductId] = useState<string>('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.oneblade_product_slug) {
          setOneBladeSlug(data.oneblade_product_slug);
        }
      }
    } catch(err) {
      console.error(err);
    }
  };

  const saveOneBladeSlug = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          settings: {
            oneblade_product_slug: oneBladeSlug || 'philips-oneblade-360-qp2824'
          }
        })
      });
      if (res.ok) {
        toast.success("Lien OneBlade mis à jour");
      }
    } catch(err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, customName?: string) => {
    const file = e.target.files?.[0];
    if (!file) return null;

    const toastId = toast.loading('Téléchargement du média...');
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (customName) formData.append('customName', customName);

      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      e.target.value = ''; // Reset input

      if (res.ok) {
        const data = await res.json();
        toast.success('Média téléchargé avec succès', { id: toastId });
        return data.url;
      } else {
        const err = await res.json();
        toast.error(`Erreur: ${err.error || 'Échec du téléchargement'}`, { id: toastId });
        return null;
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur de connexion au serveur', { id: toastId });
      return null;
    }
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
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

  const createLandingPage = async (productId: number) => {
    try {
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ product_id: productId })
      });
      
      if (res.ok) {
        toast.success('Landing page créée avec succès');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur lors de la création');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    }
  };

  const deleteLandingPage = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette landing page ?')) return;
    
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (res.ok) {
        toast.success('Landing page supprimée');
        fetchData();
      }
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEdit = (lp: any) => {
    setEditingPage(lp);
    setEditForm({
      slug: lp.slug,
      seo_title: lp.config?.seo_title || '',
      seo_description: lp.config?.seo_description || '',
      // Marketing images
      hero_image: lp.config?.hero_image || '',
      lifestyle_image_1: lp.config?.lifestyle_image_1 || '',
      lifestyle_image_2: lp.config?.lifestyle_image_2 || '',
      lifestyle_image_3: lp.config?.lifestyle_image_3 || '',
      lifestyle_image_4: lp.config?.lifestyle_image_4 || '',
      before_after_image: lp.config?.before_after_image || '',
      promo_banner_image: lp.config?.promo_banner_image || '',
      gallery_image_1: lp.config?.gallery_image_1 || '',
      gallery_image_2: lp.config?.gallery_image_2 || '',
      gallery_image_3: lp.config?.gallery_image_3 || '',
      gallery_image_4: lp.config?.gallery_image_4 || '',
      gallery_image_5: lp.config?.gallery_image_5 || '',
      ugc_video_1: lp.config?.ugc_video_1 || '',
      ugc_video_2: lp.config?.ugc_video_2 || '',
      ugc_video_3: lp.config?.ugc_video_3 || ''
    });
  };

  const saveEdit = async () => {
    try {
      setIsSaving(true);
      
      const config = { ...editForm };
      const slug = config.slug;
      const seo_title = config.seo_title;
      const seo_description = config.seo_description;
      
      delete config.slug;
      delete config.seo_title;
      delete config.seo_description;

      const res = await fetch(`/api/admin/landing-pages/${editingPage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          config,
          slug,
          seo_title,
          seo_description
        })
      });

      if (res.ok) {
        toast.success('Modifications enregistrées');
        setEditingPage(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      toast.error('Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  };

  const renderImageInput = ({ label, field, placeholder, hint, accept = "image/*" }: { label: string, field: string, placeholder?: string, hint: React.ReactNode, accept?: string }) => (
    <div key={field}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder={placeholder || 'https://...'}
          value={editForm[field] || ''}
          onChange={(e) => setEditForm(prev => ({...prev, [field]: e.target.value}))}
          className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
        />
        <label className="cursor-pointer bg-gray-100 p-2 px-3 border rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2" title="Uploader un fichier">
          <Upload size={18} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">Upload</span>
          <input type="file" className="hidden" accept={accept} onChange={async (e) => {
            const url = await handleFileUpload(e);
            if (url) setEditForm(prev => ({...prev, [field]: url}));
          }} />
        </label>
      </div>
      {hint}
    </div>
  );

  return (
    <div className="space-y-8">
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
       <div className="mb-6">
         <h2 className="text-xl font-bold text-gray-800">Pages Personnalisées (Code)</h2>
         <p className="text-sm text-gray-500 mt-1">Gérez vos pages landing créées sur mesure</p>
       </div>
       <div className="flex items-center justify-between border p-4 rounded-lg bg-gray-50">
         <div>
           <div className="font-bold text-gray-800 flex items-center gap-2">
             Philips OneBlade 360
             <span className="px-2 py-1 text-xs bg-lime-100 text-lime-800 rounded-full font-medium">Actif</span>
           </div>
           <a href="/lp/oneblade" target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
             /lp/oneblade <Eye size={14} />
           </a>
         </div>
         <div className="flex flex-col gap-2">
           <label className="text-sm text-gray-700 font-medium">Produit lié au bouton de commande :</label>
           <div className="flex items-center gap-3">
             <SmartProductSearch 
                products={products}
                value={oneBladeSlug}
                onChange={setOneBladeSlug}
                placeholder="Rechercher un produit..."
                valueKey="slug"
                className="w-80"
             />
              <button 
                onClick={saveOneBladeSlug}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <CheckCircle2 size={16} /> Appliquer
              </button>
           </div>
         </div>
       </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Landing Pages Universelles</h2>
          <p className="text-sm text-gray-500 mt-1">Gérez le contenu marketing de vos landing pages ultra-premium</p>
        </div>
        
        {/* Generer LP form */}
        <div className="flex items-center gap-2">
          <SmartProductSearch 
            products={products}
            value={newLpProductId}
            onChange={setNewLpProductId}
            placeholder="Sélectionner un produit"
            valueKey="id"
            className="w-64"
          />
          <button 
            onClick={() => {
              if (newLpProductId) createLandingPage(parseInt(newLpProductId));
            }}
            className="bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 flex items-center gap-2 text-sm font-medium transition-all shadow-sm"
          >
            <Plus size={16} /> Générer une LP
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
              <th className="px-6 py-4 font-medium">Produit</th>
              <th className="px-6 py-4 font-medium">Lien (Slug)</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8">Chargement...</td></tr>
            ) : landingPages.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Aucune landing page. Sélectionnez un produit ci-dessus et cliquez sur Générer.</td></tr>
            ) : (
              landingPages.map(lp => (
                <tr key={lp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={lp.product_image || 'https://via.placeholder.com/40'} alt={lp.product_name} className="w-10 h-10 rounded object-cover" />
                      <span className="font-medium text-gray-800">{lp.product_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-l border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-mono text-sm max-w-[200px] truncate">/landing/{lp.slug}</span>
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/landing/${lp.slug}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Lien copié');
                        }}
                        className="text-gray-400 hover:text-gray-700" title="Copier le lien"
                      ><Copy size={14} /></button>
                      <a href={`/landing/${lp.slug}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600" title="Voir la page">
                        <Eye size={14} />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(lp.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(lp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Modifier le contenu">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteLandingPage(lp.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDITION */}
      {editingPage && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold">Modifier le contenu marketing</h3>
                <p className="text-sm text-gray-500 mt-1">Produit : {editingPage.product_name}</p>
              </div>
              <button onClick={() => setEditingPage(null)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-8">
              
              {/* CONFIG GENERALE & SEO */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2">Général & SEO</h4>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({...editForm, slug: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                  />
                </div>
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
                  <textarea
                    value={editForm.seo_description}
                    onChange={(e) => setEditForm({...editForm, seo_description: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500"
                    rows={2}
                  />
                </div>
              </div>

              {/* IMAGES MARKETING */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2">Hero & Lifestyle (Images directes)</h4>
                {renderImageInput({
                  label: "Image Hero Principale",
                  field: "hero_image",
                  hint: <p className="text-xs text-gray-500 mt-1">Sert pour la grande image plein écran au démarrage.<br/><strong className="text-blue-600">Recommandé :</strong> Vertical 1080x1920px (9:16) ou Carré 1080x1080px (1:1).</p>
                })}
                {renderImageInput({
                  label: "Image Lifestyle 1",
                  field: "lifestyle_image_1",
                  hint: <p className="text-xs text-gray-500 mt-1">Image pour la section Problème/Solution.<br/><strong className="text-blue-600">Recommandé :</strong> Vertical 1080x1350px (4:5) ou Carré (1:1).</p>
                })}
                {renderImageInput({
                  label: "Image Lifestyle 2",
                  field: "lifestyle_image_2",
                  hint: <p className="text-xs text-gray-500 mt-1">Image plein écran style Nike/Apple.<br/><strong className="text-blue-600">Recommandé :</strong> Horizontal 1920x1080px (16:9) ou Carré pour mobile.</p>
                })}
                {renderImageInput({
                  label: "Image Lifestyle 3",
                  field: "lifestyle_image_3",
                  hint: <p className="text-xs text-gray-500 mt-1">Image 3 dynamique pour features.<br/><strong className="text-blue-600">Recommandé :</strong> Vertical 1080x1350px (4:5) ou Carré (1:1).</p>
                })}
                {renderImageInput({
                  label: "Image Lifestyle 4",
                  field: "lifestyle_image_4",
                  hint: <p className="text-xs text-gray-500 mt-1">Image pour encarts ou features.<br/><strong className="text-blue-600">Recommandé :</strong> Vertical 1080x1350px (4:5) ou Carré (1:1).</p>
                })}
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2">Médias Spécifiques & Galeries</h4>
                {renderImageInput({
                  label: "Image Avant/Après",
                  field: "before_after_image",
                  hint: <p className="text-xs text-gray-500 mt-1">Utilisé dans la section démonstration.<br/><strong className="text-blue-600">Recommandé :</strong> Horizontal 1920x1080px (16:9) ou 1080x810px (4:3).</p>
                })}
                {renderImageInput({
                  label: "Bannière Promo",
                  field: "promo_banner_image",
                  hint: <p className="text-xs text-gray-500 mt-1">Bannière fond de section CTA.<br/><strong className="text-blue-600">Recommandé :</strong> Horizontal 1920x1080px (16:9).</p>
                })}
                {renderImageInput({
                  label: "Image Galerie 1",
                  field: "gallery_image_1",
                  hint: <p className="text-xs text-gray-500 mt-1"><strong className="text-blue-600">Recommandé :</strong> Carré 1080x1080px (1:1).</p>
                })}
                {renderImageInput({
                  label: "Image Galerie 2",
                  field: "gallery_image_2",
                  hint: <p className="text-xs text-gray-500 mt-1"><strong className="text-blue-600">Recommandé :</strong> Carré 1080x1080px (1:1).</p>
                })}
                {renderImageInput({
                  label: "Image Galerie 3",
                  field: "gallery_image_3",
                  hint: <p className="text-xs text-gray-500 mt-1"><strong className="text-blue-600">Recommandé :</strong> Carré 1080x1080px (1:1).</p>
                })}
                {renderImageInput({
                  label: "Image Galerie 4",
                  field: "gallery_image_4",
                  hint: <p className="text-xs text-gray-500 mt-1"><strong className="text-blue-600">Recommandé :</strong> Carré 1080x1080px (1:1).</p>
                })}
                {renderImageInput({
                  label: "Image Galerie 5",
                  field: "gallery_image_5",
                  hint: <p className="text-xs text-gray-500 mt-1"><strong className="text-blue-600">Recommandé :</strong> Carré 1080x1080px (1:1).</p>
                })}
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2">Vidéos UGC (.mp4, .webm)</h4>
                {renderImageInput({
                  label: "Vidéo UGC 1",
                  field: "ugc_video_1",
                  accept: "image/*,video/*",
                  hint: <p className="text-xs text-gray-500 mt-1">Vidéo type Reels/TikTok. <strong className="text-blue-600">Recommandé :</strong> Vertical 1080x1920px (9:16).</p>
                })}
                {renderImageInput({
                  label: "Vidéo UGC 2",
                  field: "ugc_video_2",
                  accept: "image/*,video/*",
                  hint: <p className="text-xs text-gray-500 mt-1"><strong className="text-blue-600">Recommandé :</strong> Vertical 1080x1920px (9:16).</p>
                })}
                {renderImageInput({
                  label: "Vidéo UGC 3",
                  field: "ugc_video_3",
                  accept: "image/*,video/*",
                  hint: <p className="text-xs text-gray-500 mt-1"><strong className="text-blue-600">Recommandé :</strong> Vertical 1080x1920px (9:16).</p>
                })}
              </div>

            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button 
                onClick={() => setEditingPage(null)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Annuler
              </button>
              <button 
                onClick={saveEdit}
                disabled={isSaving}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 flex items-center gap-2"
              >
                {isSaving ? 'Enregistrement...' : <>Enregistrer <CheckCircle2 size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
