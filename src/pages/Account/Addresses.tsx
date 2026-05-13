import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, Home, Briefcase, User, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ALGERIA_COMMUNES } from '../../utils/communes';
import { fetchWithCache } from '../../lib/utils';

interface Wilaya {
  number: string;
  name: string;
}

export default function Addresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    wilaya: '',
    commune: '',
    address: '',
    phone: '',
    isPrimary: false
  });
  const supabase = getSupabase();

  useEffect(() => {
    const fetchWilayas = async () => {
      try {
        const data = await fetchWithCache('/api/wilayas');
        if (Array.isArray(data)) {
          setWilayas(data.filter((w: any) => w.is_active === true || w.is_active === 1));
        }
      } catch (error) {
        console.error('Failed to fetch wilayas:', error);
      }
    };
    fetchWilayas();
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', user.id);
      
      if (error) throw error;
      setAddresses(data.map(d => ({ ...d, isPrimary: d.is_primary })));
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    try {
      if (formData.isPrimary) {
        // Unset other primary addresses
        await supabase
          .from('addresses')
          .update({ is_primary: false })
          .eq('profile_id', user.id);
      }

      const payload = {
        profile_id: user.id,
        title: formData.title,
        wilaya: formData.wilaya,
        commune: formData.commune,
        address: formData.address,
        phone: formData.phone,
        is_primary: formData.isPrimary,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('addresses')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Adresse mise à jour');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert([payload]);
        if (error) throw error;
        toast.success('Adresse ajoutée');
      }
      
      setFormData({ title: '', wilaya: '', commune: '', address: '', phone: '', isPrimary: false });
      setShowForm(false);
      setEditingId(null);
      fetchAddresses();
    } catch (error: any) {
      console.error('Save address error:', error);
      toast.error('Erreur lors de l\'enregistrement: ' + (error.message || ''));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette adresse ?') || !supabase) return;
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Adresse supprimée');
      fetchAddresses();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression: ' + (error.message || ''));
    }
  };

  const startEdit = (addr: any) => {
    // Attempt to find wilaya number from name if it was stored as string previously
    let wilayaNum = addr.wilaya || '';
    if (isNaN(Number(wilayaNum)) && wilayas.length > 0) {
      const found = wilayas.find(w => w.name === addr.wilaya);
      if (found) wilayaNum = found.number;
    }

    setFormData({
      title: addr.title,
      wilaya: wilayaNum,
      commune: addr.commune || '',
      address: addr.address,
      phone: addr.phone,
      isPrimary: addr.is_primary || addr.isPrimary
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Adresses</h2>
          <p className="text-gray-500 text-sm">Gérez vos lieux de livraison préférés.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => {
              setFormData({ title: '', wilaya: '', commune: '', address: '', phone: '', isPrimary: false });
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-all shadow-md shadow-orange-100"
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nom de l'adresse</label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
                  placeholder="Ex: Maison, Bureau..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Wilaya</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 z-10" />
                    <select
                      required
                      value={formData.wilaya}
                      onChange={e => setFormData({...formData, wilaya: e.target.value, commune: ''})}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all appearance-none"
                    >
                      <option value="" disabled>Sélectionnez</option>
                      {wilayas.map(w => (
                        <option key={w.number} value={w.number}>{w.number} - {w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Commune</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 z-10" />
                    <select
                      required
                      disabled={!formData.wilaya}
                      value={formData.commune}
                      onChange={e => setFormData({...formData, commune: e.target.value})}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all appearance-none disabled:bg-gray-50"
                    >
                      <option value="" disabled>Sélectionnez</option>
                      {formData.wilaya && ALGERIA_COMMUNES[formData.wilaya]?.map(commune => (
                        <option key={commune} value={commune}>{commune}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Adresse complète</label>
              <textarea 
                required
                rows={3}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all resize-none"
                placeholder="Rue, N°, Bâtiment..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Téléphone de contact</label>
              <input 
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
                placeholder="05 55 55 55 55"
              />
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isPrimary" className="ml-2 text-sm text-gray-700">Définir comme adresse principale</label>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-40 bg-gray-50 animate-pulse rounded-2xl"></div>)
        ) : addresses.length > 0 ? (
          addresses.map((addr) => (
            <div key={addr.id} className={`bg-white border p-6 rounded-2xl shadow-sm transition-all relative group ${addr.isPrimary ? 'border-orange-500 bg-orange-50/10' : 'border-gray-100'}`}>
              {addr.isPrimary && (
                <div className="absolute top-4 right-6 flex items-center text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Principale
                </div>
              )}
              
              <div className="flex items-start space-x-4">
                <div className={`${addr.isPrimary ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'} p-3 rounded-xl`}>
                  {addr.title.toLowerCase().includes('maison') ? <Home className="w-5 h-5" /> : 
                   addr.title.toLowerCase().includes('bureau') || addr.title.toLowerCase().includes('travail') ? <Briefcase className="w-5 h-5" /> : 
                   <MapPin className="w-5 h-5" />}
                </div>
                <div className="flex-1 pr-12">
                  <h4 className="font-bold text-gray-900 capitalize">{addr.title}</h4>
                  <p className="text-sm font-bold text-gray-700 mt-1">{addr.wilaya}{addr.commune ? ` - ${addr.commune}` : ''}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{addr.address}</p>
                  <p className="text-xs font-medium text-gray-400 mt-3">{addr.phone}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-2 border-t border-gray-50 pt-4">
                <button 
                  onClick={() => startEdit(addr)}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : !showForm && (
          <div className="col-span-full text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-white w-16 h-16 rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Aucune adresse enregistrée</h3>
            <p className="text-gray-500 mt-1 max-w-xs mx-auto text-sm">Ajoutez vos adresses de livraison pour passer commande plus rapidement.</p>
          </div>
        )}
      </div>
    </div>
  );
}
