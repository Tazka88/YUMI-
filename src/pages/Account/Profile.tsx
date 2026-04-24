import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Phone, MapPin, Save, Shield, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    wilaya: '',
    fullAddress: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        wilaya: profile.wilaya || '',
        fullAddress: profile.fullAddress || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
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
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={formData.wilaya}
                onChange={e => setFormData({...formData, wilaya: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
                placeholder="Ex: 16 Alger"
              />
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
