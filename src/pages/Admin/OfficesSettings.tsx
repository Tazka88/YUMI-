import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, MapPin, Phone, Navigation } from 'lucide-react';
import { ALGERIA_COMMUNES } from '../../utils/communes';

export default function OfficesSettings() {
  const [offices, setOffices] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    wilaya: '',
    commune: '',
    phone: ''
  });

  const fetchOffices = async () => {
    try {
      const res = await fetch('/api/offices');
      const data = await res.json();
      if(Array.isArray(data)) setOffices(data);
    } catch (err) {
      console.error('Failed to fetch offices', err);
    }
  };

  const fetchWilayas = async () => {
    try {
      const res = await fetch('/api/wilayas');
      const data = await res.json();
      if (Array.isArray(data)) {
        setWilayas(data.filter((w: any) => w.is_active === true || w.is_active === 1));
      }
    } catch (err) {
      console.error('Failed to fetch wilayas', err);
    }
  };

  useEffect(() => {
    fetchOffices();
    fetchWilayas();
  }, []);

  const filteredOffices = offices.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(o.wilaya).includes(searchTerm) || o.commune.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingOffice ? `/api/admin/offices/${editingOffice.id}` : '/api/admin/offices';
    const method = editingOffice ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(editingOffice ? "Point relais mis à jour" : "Point relais ajouté");
        fetchOffices();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'opération");
      }
    } catch (e) {
      toast.error("Erreur de connexion");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce point relais ?")) return;
    try {
      const res = await fetch(`/api/admin/offices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        toast.success("Point relais supprimé");
        fetchOffices();
      }
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestion des Points Relais (DHD Livraison)</h2>
          <p className="text-sm text-gray-500 mt-1">Gérez les adresses des bureaux Stop Desk</p>
        </div>
        <button 
          onClick={() => {
             setFormData({name: '', address: '', wilaya: '', commune: '', phone: ''});
             setEditingOffice(null);
             setIsModalOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Ajouter un bureau
        </button>
      </div>

      <div className="p-6">
        <div className="mb-6 relative">
          <input 
            type="text" 
            placeholder="Rechercher par nom, wilaya, commune..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffices.map((office) => (
            <div key={office.id} className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => {
                    setEditingOffice(office);
                    setFormData({
                      name: office.name,
                      address: office.address,
                      wilaya: office.wilaya,
                      commune: office.commune,
                      phone: office.phone || ''
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                  title="Modifier"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(office.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-orange-100 text-orange-600 p-3 rounded-lg font-bold">
                  {office.wilaya}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{office.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{office.commune}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Adresse</span>
                  <span className="font-medium">{office.address}</span>
                </div>
                {office.phone && (
                  <div className="flex flex-col text-sm pt-2">
                    <span className="text-gray-500 mb-1 flex items-center gap-1">
                      <Phone size={14} /> Téléphones
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {office.phone.split(',').map((p: string, idx: number) => (
                        <span key={idx} className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium">
                          {p.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredOffices.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              Aucun point relais trouvé
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingOffice ? 'Modifier le point relais' : 'Ajouter un point relais'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du bureau *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Bureau Centre"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wilaya *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <select 
                    required
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none bg-white"
                    value={formData.wilaya}
                    onChange={(e) => setFormData({...formData, wilaya: e.target.value, commune: ''})}
                  >
                    <option value="" disabled>Sélectionnez une wilaya</option>
                    {wilayas.map(w => (
                      <option key={w.number} value={w.number}>{w.number} - {w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commune *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Navigation size={18} className="text-gray-400" />
                  </div>
                  <select 
                    required
                    disabled={!formData.wilaya}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 appearance-none bg-white disabled:bg-gray-50"
                    value={formData.commune}
                    onChange={(e) => setFormData({...formData, commune: e.target.value})}
                  >
                    <option value="" disabled>{!formData.wilaya ? 'D\'abord choisir une wilaya' : 'Sélectionnez une commune'}</option>
                    {formData.wilaya && ALGERIA_COMMUNES[formData.wilaya]?.map(commune => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone(s) du bureau (Séparez par des virgules)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Ex: 0555000000, 0666000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète *</label>
                <textarea 
                  required
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Ex: 12 Rue Didouche Mourad"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
                >
                  {editingOffice ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
