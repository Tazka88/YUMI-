import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { User, Mail, Phone, MapPin, Save, Shield, Calendar, Navigation } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ALGERIA_COMMUNES } from '../../utils/communes';
import { fetchWithCache } from '../../lib/utils';

interface Wilaya {
  number: string;
  name: string;
}

export default function Profile() {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    wilaya: '',
    commune: '',
    fullAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
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
    if (profile) {
      // Find wilaya number from name if stored as name
      let wilayaNum = profile.wilaya || '';
      if (isNaN(Number(wilayaNum)) && wilayas.length > 0) {
        const found = wilayas.find(w => w.name === profile.wilaya);
        if (found) wilayaNum = found.number;
      }

      setFormData({
        firstName: profile.first_name || profile.firstName || '',
        lastName: profile.last_name || profile.lastName || '',
        phone: profile.phone || '',
        wilaya: wilayaNum,
        commune: profile.commune || '',
        fullAddress: profile.full_address || profile.fullAddress || ''
      });
    }
  }, [profile, wilayas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    setLoading(true);
    try {
      const selectedWilaya = wilayas.find(w => w.number === formData.wilaya);
      const wilayaValue = selectedWilaya ? `${selectedWilaya.number} ${selectedWilaya.name}` : formData.wilaya;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          wilaya: formData.wilaya, // We'll store the number to keep it consistent with selects
          commune: formData.commune,
          full_address: formData.fullAddress,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error('Erreur lors de la mise à jour: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
        <p className="text-gray-500 text-sm">Gérez vos informations personnelles et votre compte.</p>
      </div>

      <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl flex items-center space-x-4">
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <Shield className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h4 className="font-bold text-orange-900 text-sm">Sécurité du compte</h4>
          <p className="text-xs text-orange-800 mt-0.5">Votre email est vérifié et votre compte est protégé par Zorando.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Prénom</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Nom</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 opacity-60">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Email (Non modifiable)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              disabled
              value={user?.email || ''}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Wilaya</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                required
                value={formData.wilaya}
                onChange={e => setFormData({...formData, wilaya: e.target.value, commune: ''})}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all appearance-none"
              >
                <option value="" disabled>Sélectionnez votre wilaya</option>
                {wilayas.map(w => (
                  <option key={w.number} value={w.number}>{w.number} - {w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Commune</label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                required
                disabled={!formData.wilaya}
                value={formData.commune}
                onChange={e => setFormData({...formData, commune: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all appearance-none disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="" disabled>{!formData.wilaya ? 'D\'abord choisir une wilaya' : 'Sélectionnez votre commune'}</option>
                {formData.wilaya && ALGERIA_COMMUNES[formData.wilaya]?.map(commune => (
                  <option key={commune} value={commune}>{commune}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Adresse complète par défaut</label>
          <textarea
            rows={3}
            value={formData.fullAddress}
            onChange={e => setFormData({...formData, fullAddress: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all resize-none"
            placeholder="Votre adresse principale de livraison..."
          />
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Membre depuis le : {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : '...'}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : <>
              <Save className="w-4 h-4 mr-2" /> Enregistrer les modifications
            </>}
          </button>
        </div>
      </form>
    </div>
  );
}
