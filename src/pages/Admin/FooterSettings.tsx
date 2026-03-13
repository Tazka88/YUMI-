import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Save, Check, X } from 'lucide-react';

export default function FooterSettings() {
  const [links, setLinks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [linkForm, setLinkForm] = useState({ name: '', url: '', column_id: 1, order_index: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchFooterData = () => {
    fetch('/api/footer-links')
      .then(res => res.json())
      .then(setLinks);
    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettings);
  };

  useEffect(() => {
    fetchFooterData();
  }, []);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingLink ? `/api/admin/footer-links/${editingLink.id}` : '/api/admin/footer-links';
    const method = editingLink ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(linkForm)
      });

      if (res.ok) {
        setIsLinkModalOpen(false);
        setEditingLink(null);
        setLinkForm({ name: '', url: '', column_id: 1, order_index: 0 });
        fetchFooterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lien ?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/footer-links/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFooterData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSaveMessage('Paramètres enregistrés avec succès');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Simple move up/down for reordering
  const moveLink = async (index: number, direction: 'up' | 'down', columnId: number) => {
    const columnLinks = links.filter(l => l.column_id === columnId).sort((a, b) => a.order_index - b.order_index);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === columnLinks.length - 1)
    ) return;

    const newLinks = [...columnLinks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items in array
    const temp = newLinks[index];
    newLinks[index] = newLinks[swapIndex];
    newLinks[swapIndex] = temp;

    // Re-assign order_index based on new array order
    const updatedLinks = newLinks.map((link, i) => ({
      ...link,
      order_index: i
    }));

    const token = localStorage.getItem('adminToken');
    try {
      await fetch('/api/admin/footer-links/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ links: updatedLinks })
      });
      fetchFooterData();
    } catch (err) {
      console.error(err);
    }
  };

  const renderLinksColumn = (columnId: number, title: string) => {
    const columnLinks = links.filter(l => l.column_id === columnId).sort((a, b) => a.order_index - b.order_index);
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-800">Colonne {columnId} : {title}</h3>
          <button 
            onClick={() => {
              setEditingLink(null);
              setLinkForm({ name: '', url: '', column_id: columnId, order_index: columnLinks.length });
              setIsLinkModalOpen(true);
            }}
            className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
        
        {columnLinks.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Aucun lien dans cette colonne.</p>
        ) : (
          <ul className="space-y-2">
            {columnLinks.map((link, index) => (
              <li key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 group">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveLink(index, 'up', columnId)}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-orange-500 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button 
                      onClick={() => moveLink(index, 'down', columnId)}
                      disabled={index === columnLinks.length - 1}
                      className="text-gray-400 hover:text-orange-500 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{link.name}</p>
                    <p className="text-xs text-gray-500">{link.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingLink(link);
                      setLinkForm(link);
                      setIsLinkModalOpen(true);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteLink(link.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Liens du footer */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-6">1. Liens du Footer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderLinksColumn(1, "BESOIN D'AIDE ?")}
          {renderLinksColumn(2, "À PROPOS")}
        </div>
      </section>

      <form onSubmit={handleSettingsSubmit} className="space-y-8">
        {/* Réseaux sociaux */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">2. Réseaux Sociaux</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['facebook', 'instagram', 'tiktok', 'youtube'].map(network => (
              <div key={network} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 capitalize">{network}</label>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={settings[`social_${network}_visible`] === '1'}
                        onChange={(e) => handleSettingChange(`social_${network}_visible`, e.target.checked ? '1' : '0')}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${settings[`social_${network}_visible`] === '1' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings[`social_${network}_visible`] === '1' ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="ml-2 text-xs text-gray-500">Afficher</span>
                  </label>
                </div>
                <input 
                  type="url" 
                  value={settings[`social_${network}`] || ''}
                  onChange={(e) => handleSettingChange(`social_${network}`, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder={`URL ${network}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Coordonnées */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">3. Coordonnées</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
              <input 
                type="email" 
                value={settings.contact_email || ''}
                onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
              <input 
                type="text" 
                value={settings.contact_phone || ''}
                onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input 
                type="text" 
                value={settings.contact_address || ''}
                onChange={(e) => handleSettingChange('contact_address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </section>

        {/* Copyright */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">4. Texte de Copyright</h2>
          <div>
            <input 
              type="text" 
              value={settings.copyright_text || ''}
              onChange={(e) => handleSettingChange('copyright_text', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="© 2026 Yumi Algérie. Tous droits réservés."
            />
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            <Save size={20} />
            {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
          {saveMessage && (
            <span className="text-green-600 flex items-center gap-1 font-medium">
              <Check size={18} /> {saveMessage}
            </span>
          )}
        </div>
      </form>

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingLink ? 'Modifier le lien' : 'Ajouter un lien'}
              </h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleLinkSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lien</label>
                <input 
                  type="text" 
                  required
                  value={linkForm.name}
                  onChange={e => setLinkForm({...linkForm, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Contactez-nous"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input 
                  type="text" 
                  required
                  value={linkForm.url}
                  onChange={e => setLinkForm({...linkForm, url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: /contact ou https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colonne</label>
                <select 
                  value={linkForm.column_id}
                  onChange={e => setLinkForm({...linkForm, column_id: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value={1}>Colonne 1 (Besoin d'aide ?)</option>
                  <option value={2}>Colonne 2 (À propos)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors font-medium"
                >
                  {editingLink ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
