import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

export default function WilayasSettings() {
  const [wilayas, setWilayas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWilaya, setEditingWilaya] = useState<any>(null);
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    delivery_cost: 600,
    is_active: true
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null as number | null
  });

  const fetchWilayas = async () => {
    try {
      const res = await fetch('/api/wilayas');
      const data = await res.json();
      setWilayas(data);
    } catch (err) {
      console.error('Failed to fetch wilayas', err);
    }
  };

  useEffect(() => {
    fetchWilayas();
  }, []);

  const filteredWilayas = wilayas.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.number.includes(searchTerm)
  );

  const openModal = (wilaya: any = null) => {
    if (wilaya) {
      setEditingWilaya(wilaya);
      setFormData({
        number: wilaya.number,
        name: wilaya.name,
        delivery_cost: wilaya.delivery_cost,
        is_active: !!wilaya.is_active
      });
    } else {
      setEditingWilaya(null);
      setFormData({
        number: '',
        name: '',
        delivery_cost: 600,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingWilaya ? `/api/admin/wilayas/${editingWilaya.id}` : '/api/admin/wilayas';
    const method = editingWilaya ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setIsModalOpen(false);
      fetchWilayas();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.id) return;
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`/api/admin/wilayas/${confirmModal.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setConfirmModal({ isOpen: false, id: null });
      fetchWilayas();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleStatus = async (wilaya: any) => {
    const token = localStorage.getItem('adminToken');
    try {
      await fetch(`/api/admin/wilayas/${wilaya.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...wilaya,
          is_active: !wilaya.is_active
        })
      });
      fetchWilayas();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Gestion des Wilayas</h2>
        <button 
          onClick={() => openModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Ajouter une wilaya
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par numéro ou nom..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="p-4 font-medium">N°</th>
                <th className="p-4 font-medium">Nom de la Wilaya</th>
                <th className="p-4 font-medium">Tarif de livraison (DA)</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWilayas.length > 0 ? (
                filteredWilayas.map((wilaya) => (
                  <tr key={wilaya.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{wilaya.number}</td>
                    <td className="p-4 text-gray-800">{wilaya.name}</td>
                    <td className="p-4 font-medium text-orange-600">{wilaya.delivery_cost} DA</td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(wilaya)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          wilaya.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {wilaya.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(wilaya)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => setConfirmModal({ isOpen: true, id: wilaya.id })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Aucune wilaya trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajouter/Modifier */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                {editingWilaya ? 'Modifier la wilaya' : 'Ajouter une wilaya'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro (ex: 01)</label>
                <input 
                  type="text" 
                  required
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la wilaya</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarif de livraison (DA)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="10"
                  value={formData.delivery_cost}
                  onChange={(e) => setFormData({...formData, delivery_cost: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Wilaya active (disponible pour la livraison)
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
                >
                  {editingWilaya ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer cette wilaya ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, id: null })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
