import React, { useState, useEffect } from 'react';
import { Eye, Copy, Trash2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPagesAdmin() {
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lpRes, prRes] = await Promise.all([
        fetch('/api/admin/landing-pages'),
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
    </div>
  );
}
