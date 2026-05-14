import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { Edit, Search, X, MapPin } from 'lucide-react';
import { useCommunesStore } from '../../store/useCommunesStore';

export default function CommunesSettings() {
  const [communes, setCommunes] = useState<any[]>([]);
  const [wilayas, setWilayas] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommune, setEditingCommune] = useState<any>(null);
  const { fetchCommunes: fetchPublicCommunes } = useCommunesStore();

  const [formData, setFormData] = useState({
    name: ''
  });

  const fetchAdminCommunes = async () => {
    try {
      const res = await fetch('/api/admin/communes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCommunes(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin communes', err);
    }
  };

  const fetchWilayas = async () => {
    try {
      const res = await fetch('/api/wilayas');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        for(const w of data) {
          map[w.number] = w.name;
        }
        setWilayas(map);
      }
    } catch (err) {
      console.error('Failed to fetch wilayas', err);
    }
  };

  useEffect(() => {
    fetchAdminCommunes();
    fetchWilayas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommune) return;
    
    try {
      const res = await fetch(`/api/admin/communes/${editingCommune.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Commune mise à jour");
        await fetchAdminCommunes();
        // Since orthographe changed, we update the global store as well so it applies instantly on frontend views
        useCommunesStore.setState({ fetched: false, communes: {} });
        fetchPublicCommunes();
        setIsModalOpen(false);
      } else {
        toast.error("Erreur lors de l'opération");
      }
    } catch (err) {
      toast.error("Erreur de connexion");
    }
  };

  // Group by wilaya for clean display, or just a large list?
  // Let's make a grouped list but filtered by search block.
  
  const filteredCommunes = communes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.wilaya.includes(searchTerm) || 
    (wilayas[c.wilaya] && wilayas[c.wilaya].toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestion des Communes</h2>
          <p className="text-sm text-gray-500 mt-1">Modifiez l'orthographe des communes pour chaque wilaya</p>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 relative">
          <input 
            type="text" 
            placeholder="Rechercher par nom de commune ou wilaya..." 
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-medium text-gray-500 text-sm">Wilaya</th>
                <th className="p-4 font-medium text-gray-500 text-sm">Commune</th>
                <th className="p-4 font-medium text-gray-500 text-sm w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCommunes.slice(0, 100).map((c) => ( // Show first 100 to avoid freezing
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                     <span className="font-bold text-gray-700">{c.wilaya}</span> - <span className="text-gray-500">{wilayas[c.wilaya] || '...'}</span>
                  </td>
                  <td className="p-4 font-medium text-gray-900">{c.name}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => {
                        setEditingCommune(c);
                        setFormData({ name: c.name });
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors inline-block"
                      title="Modifier l'orthographe"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCommunes.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Aucune commune trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredCommunes.length > 100 && (
             <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t">
               Affichage de 100 résultats sur {filteredCommunes.length}. Utilisez la recherche pour affiner.
             </div>
          )}
        </div>
      </div>

      {isModalOpen && editingCommune && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Modifier l'orthographe</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border">
                 Wilaya: <strong>{editingCommune.wilaya} - {wilayas[editingCommune.wilaya]}</strong>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la commune *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    required
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={formData.name}
                    onChange={(e) => setFormData({name: e.target.value})}
                  />
                </div>
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
