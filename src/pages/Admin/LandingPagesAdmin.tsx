import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPagesAdmin() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [oneBladeSlug, setOneBladeSlug] = useState('');

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
          oneblade_product_slug: oneBladeSlug || 'philips-oneblade-qp2824-10-tondeuse-rechargeable-original-algerie'
        })
      });
      if (res.ok) {
        toast.success("Lien OneBlade mis à jour");
      }
    } catch(err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const prRes = await fetch('/api/products');
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

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Pages Personnalisées (Code)</h2>
          <p className="text-sm text-gray-500 mt-1">Gérez vos pages landing créées sur mesure</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border p-4 rounded-lg bg-gray-50 gap-4">
          <div>
            <div className="font-bold text-gray-800 flex items-center gap-2">
              Philips OneBlade 360
              <span className="px-2 py-1 text-xs bg-lime-100 text-lime-800 rounded-full font-medium">Actif</span>
            </div>
            <a href="/lp/oneblade" target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
              /lp/oneblade <Eye size={14} />
            </a>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-sm text-gray-700 font-medium">Produit lié au bouton de commande :</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:max-w-xs">
                <input 
                   type="text"
                   list="oneblade-products"
                   value={oneBladeSlug}
                   onChange={(e) => setOneBladeSlug(e.target.value)}
                   placeholder="Rechercher ou coller le lien..."
                   className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full outline-none transition-all shadow-sm"
                 />
                 <datalist id="oneblade-products">
                   {products.map(p => (
                     <option key={p.id} value={p.slug}>{p.name}</option>
                   ))}
                 </datalist>
              </div>
               <button 
                 onClick={saveOneBladeSlug}
                 className="bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
               >
                 <CheckCircle2 size={16} /> Appliquer
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
