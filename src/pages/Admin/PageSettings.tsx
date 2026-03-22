import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import DefaultEditor from 'react-simple-wysiwyg';

export default function PageSettings() {
  const [pages, setPages] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [pageForm, setPageForm] = useState({ title: '', slug: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchPages = (signal?: AbortSignal) => {
    fetch('/api/pages', { signal })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setPages(data); })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchPages(controller.signal);
    return () => controller.abort();
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!editingPage) {
      setPageForm({ ...pageForm, title, slug: generateSlug(title) });
    } else {
      setPageForm({ ...pageForm, title });
    }
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('adminToken');
    const url = editingPage ? `/api/admin/pages/${editingPage.id}` : '/api/admin/pages';
    const method = editingPage ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pageForm)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingPage(null);
        setPageForm({ title: '', slug: '', content: '' });
        fetchPages();
      } else {
        toast.error('Erreur lors de la sauvegarde de la page');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la sauvegarde de la page');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchPages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (page: any = null) => {
    if (page) {
      setEditingPage(page);
      setPageForm({ title: page.title, slug: page.slug, content: page.content || '' });
    } else {
      setEditingPage(null);
      setPageForm({ title: '', slug: '', content: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Gestion des Pages</h2>
        <button 
          onClick={() => openModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Nouvelle page
        </button>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="pb-3 font-medium">Titre</th>
                <th className="pb-3 font-medium">URL (Slug)</th>
                <th className="pb-3 font-medium">Date de création</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 font-medium text-gray-800">{page.title}</td>
                  <td className="py-4 text-gray-500">/{page.slug}</td>
                  <td className="py-4 text-gray-500">{new Date(page.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openModal(page)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => deletePage(page.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Aucune page trouvée. Créez votre première page !
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPage ? 'Modifier la page' : 'Nouvelle page'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handlePageSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre de la page *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                    value={pageForm.title} 
                    onChange={handleTitleChange} 
                    placeholder="Ex: Qui sommes-nous"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL (Slug) *</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2 rounded-l-md text-gray-500">
                      /
                    </span>
                    <input 
                      type="text" 
                      required
                      className="flex-1 px-4 py-2 rounded-r-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={pageForm.slug} 
                      onChange={e => setPageForm({...pageForm, slug: e.target.value})} 
                      placeholder="qui-sommes-nous"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contenu *</label>
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <DefaultEditor 
                    value={pageForm.content} 
                    onChange={e => setPageForm({...pageForm, content: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
