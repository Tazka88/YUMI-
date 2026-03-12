import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, TrendingUp, AlertCircle, Package, Plus, Edit, Trash2, X, Image as ImageIcon, Upload } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [productSubTab, setProductSubTab] = useState('products');
  const [stats, setStats] = useState({ orders: 0, revenue: 0, lowStock: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });
  
  const [productForm, setProductForm] = useState({
    name: '', slug: '', category_id: '', subcategory_id: '', brand_id: '', price: '', promo_price: '', stock: '', description: '', image: '',
    is_popular: false, is_best_seller: false, is_new: false, is_recommended: false, is_fast_delivery: false, images: [] as any[],
    features: [] as { key: string, value: string }[],
    key_points: [] as string[]
  });
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '', slug: '', category_id: '', image: ''
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '', slug: '', image: ''
  });
  const [brandForm, setBrandForm] = useState({
    name: '', slug: '', image: '', description: ''
  });
  const [slideForm, setSlideForm] = useState({
    title: '', description: '', image: '', link: '', button_text: '', order_index: 0
  });
  const [settingsForm, setSettingsForm] = useState({
    announcement_phone: '', announcement_text: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    fetch('/api/admin/stats', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(setStats)
      .catch(() => navigate('/admin/login'));

    fetch('/api/admin/orders', { headers })
      .then(res => res.json())
      .then(setOrders);

    fetch('/api/admin/products', { headers })
      .then(res => res.json())
      .then(setProducts);

    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories);

    fetch('/api/brands')
      .then(res => res.json())
      .then(setBrands);

    fetch('/api/admin/slides', { headers })
      .then(res => res.json())
      .then(setSlides);

    fetch('/api/settings')
      .then(res => res.json())
      .then(setSettingsForm);
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return null;

    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const updateOrderStatus = async (id: number, status: string) => {
    const token = localStorage.getItem('adminToken');
    await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    // Refresh orders
    fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setOrders);
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'nouvelle': return 'bg-blue-100 text-blue-800';
      case 'confirmée': return 'bg-yellow-100 text-yellow-800';
      case 'expédiée': return 'bg-purple-100 text-purple-800';
      case 'livrée': return 'bg-green-100 text-green-800';
      case 'annulée': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name, slug: product.slug, category_id: product.category_id, subcategory_id: product.subcategory_id || '', brand_id: product.brand_id || '',
        price: product.price, promo_price: product.promo_price || '', stock: product.stock, 
        description: product.description || '', image: product.image || '',
        is_popular: !!product.is_popular, is_best_seller: !!product.is_best_seller, 
        is_new: !!product.is_new, is_recommended: !!product.is_recommended,
        is_fast_delivery: !!product.is_fast_delivery,
        images: product.images || [],
        features: product.features || [],
        key_points: product.key_points || []
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', slug: '', category_id: categories[0]?.id || '', subcategory_id: '', brand_id: '', price: '', promo_price: '', stock: '', description: '', image: '',
        is_popular: false, is_best_seller: false, is_new: false, is_recommended: false, is_fast_delivery: false, images: [], features: [], key_points: []
      });
    }
    setIsModalOpen(true);
  };

  const openSubcategoryModal = (subcategory: any = null) => {
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubcategoryForm({
        name: subcategory.name, slug: subcategory.slug, category_id: subcategory.category_id, image: subcategory.image || ''
      });
    } else {
      setEditingSubcategory(null);
      setSubcategoryForm({
        name: '', slug: '', category_id: categories[0]?.id || '', image: ''
      });
    }
    setIsSubcategoryModalOpen(true);
  };

  const openCategoryModal = (category: any = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name, slug: category.slug, image: category.image || ''
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '', slug: '', image: ''
      });
    }
    setIsCategoryModalOpen(true);
  };

  const openSlideModal = (slide: any = null) => {
    if (slide) {
      setEditingSlide(slide);
      setSlideForm({
        title: slide.title, description: slide.description || '', image: slide.image || '', 
        link: slide.link || '', button_text: slide.button_text || '', order_index: slide.order_index || 0
      });
    } else {
      setEditingSlide(null);
      setSlideForm({
        title: '', description: '', image: '', link: '', button_text: '', order_index: 0
      });
    }
    setIsSlideModalOpen(true);
  };

  const openBrandModal = (brand: any = null) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandForm({
        name: brand.name, slug: brand.slug, image: brand.image || '', description: brand.description || ''
      });
    } else {
      setEditingBrand(null);
      setBrandForm({
        name: '', slug: '', image: '', description: ''
      });
    }
    setIsBrandModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';

    const payload = {
      ...productForm,
      price: parseFloat(productForm.price as string),
      promo_price: productForm.promo_price ? parseFloat(productForm.promo_price as string) : null,
      stock: parseInt(productForm.stock as string, 10),
    };

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    setIsModalOpen(false);
    fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setProducts);
  };

  const deleteProduct = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        await fetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(setProducts);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingSubcategory ? `/api/admin/subcategories/${editingSubcategory.id}` : '/api/admin/subcategories';
    const method = editingSubcategory ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(subcategoryForm)
    });

    setIsSubcategoryModalOpen(false);
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories);
  };

  const deleteSubcategory = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        await fetch(`/api/admin/subcategories/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetch('/api/categories')
          .then(res => res.json())
          .then(setCategories);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(categoryForm)
    });

    setIsCategoryModalOpen(false);
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories);
  };

  const deleteCategory = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        await fetch(`/api/admin/categories/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetch('/api/categories')
          .then(res => res.json())
          .then(setCategories);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleSlideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingSlide ? `/api/admin/slides/${editingSlide.id}` : '/api/admin/slides';
    const method = editingSlide ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(slideForm)
    });

    setIsSlideModalOpen(false);
    fetch('/api/admin/slides', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setSlides);
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : '/api/admin/brands';
    const method = editingBrand ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(brandForm)
    });

    setIsBrandModalOpen(false);
    fetch('/api/brands')
      .then(res => res.json())
      .then(setBrands);
  };

  const deleteSlide = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer ce slide ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        await fetch(`/api/admin/slides/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetch('/api/admin/slides', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(setSlides);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const deleteBrand = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer cette marque ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`/api/admin/brands/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "Erreur lors de la suppression");
          setConfirmModal({ ...confirmModal, isOpen: false });
          return;
        }
        
        fetch('/api/brands')
          .then(res => res.json())
          .then(setBrands);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settingsForm)
      });
      alert('Paramètres enregistrés avec succès !');
    } catch (err) {
      alert('Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="bg-orange-500 text-white px-2 py-1 rounded-md font-black italic text-xl">Y</div>
          <span className="text-xl font-bold tracking-tight">Yumi Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Tableau de bord
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'orders' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <ShoppingBag size={20} />
            Commandes
            {orders.filter(o => o.status === 'nouvelle').length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {orders.filter(o => o.status === 'nouvelle').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'products' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Package size={20} />
            Produits & Catégories
          </button>
          <button 
            onClick={() => setActiveTab('brands')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'brands' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Marques
          </button>
          <button 
            onClick={() => setActiveTab('images')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'images' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <ImageIcon size={20} />
            Gestion des images (Slider)
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'customers' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Users size={20} />
            Clients
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'settings' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Settings size={20} />
            Paramètres
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">
            {activeTab === 'overview' ? "Vue d'ensemble" : activeTab}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Connecté en tant que <strong className="text-gray-800">Admin</strong></span>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold">
              A
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Commandes</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.orders}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                  <ShoppingBag size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Chiffre d'affaires</p>
                  <h3 className="text-3xl font-bold text-gray-900">{formatPrice(stats.revenue)}</h3>
                </div>
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Produits stock faible</p>
                  <h3 className="text-3xl font-bold text-gray-900">{stats.lowStock}</h3>
                </div>
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Dernières commandes</h2>
                <button onClick={() => setActiveTab('orders')} className="text-sm text-orange-500 hover:underline">Voir tout</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-medium">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3">Wilaya</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">#{order.id}</td>
                        <td className="px-6 py-4">{order.customer_name}</td>
                        <td className="px-6 py-4">{order.wilaya}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(order.total_amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Gestion des commandes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Téléphone</th>
                    <th className="px-6 py-3">Wilaya</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">#{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.address}</div>
                      </td>
                      <td className="px-6 py-4">{order.customer_phone}</td>
                      <td className="px-6 py-4">{order.wilaya}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(order.total_amount)}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize border-0 cursor-pointer focus:ring-2 focus:ring-orange-500 ${getStatusColor(order.status)}`}
                        >
                          <option value="nouvelle">Nouvelle</option>
                          <option value="confirmée">Confirmée</option>
                          <option value="expédiée">Expédiée</option>
                          <option value="livrée">Livrée</option>
                          <option value="annulée">Annulée</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-orange-500 hover:text-orange-700 font-medium text-xs">
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex gap-4 border-b border-gray-200 pb-2">
              <button 
                onClick={() => setProductSubTab('products')} 
                className={`pb-2 px-2 font-medium text-sm transition-colors ${productSubTab === 'products' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Produits
              </button>
              <button 
                onClick={() => setProductSubTab('categories')} 
                className={`pb-2 px-2 font-medium text-sm transition-colors ${productSubTab === 'categories' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Catégories
              </button>
              <button 
                onClick={() => setProductSubTab('subcategories')} 
                className={`pb-2 px-2 font-medium text-sm transition-colors ${productSubTab === 'subcategories' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Sous-catégories
              </button>
            </div>

            {productSubTab === 'products' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Gestion des produits</h2>
                  <button 
                    onClick={() => openModal()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Ajouter un produit
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                      <tr>
                        <th className="px-6 py-3">Image</th>
                        <th className="px-6 py-3">Nom</th>
                        <th className="px-6 py-3">Catégorie</th>
                        <th className="px-6 py-3">Sous-catégorie</th>
                        <th className="px-6 py-3">Marque</th>
                        <th className="px-6 py-3">Prix</th>
                        <th className="px-6 py-3">Stock</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <img src={product.image || `https://picsum.photos/seed/${product.slug}/50/50`} alt={product.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4">{product.category_name}</td>
                          <td className="px-6 py-4 text-gray-500">{product.subcategory_name || '-'}</td>
                          <td className="px-6 py-4 text-gray-500">{product.brand_name || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{formatPrice(product.price)}</div>
                            {product.promo_price && <div className="text-xs text-orange-500">{formatPrice(product.promo_price)} (Promo)</div>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <button onClick={() => openModal(product)} className="text-blue-500 hover:text-blue-700" title="Modifier">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {productSubTab === 'categories' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Gestion des catégories</h2>
                  <button 
                    onClick={() => openCategoryModal()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Ajouter une catégorie
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                      <tr>
                        <th className="px-6 py-3">Image</th>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Nom</th>
                        <th className="px-6 py-3">Slug</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categories.map(cat => (
                        <tr key={cat.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <img src={cat.image || `https://picsum.photos/seed/${cat.slug}/50/50`} alt={cat.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">#{cat.id}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                          <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <button onClick={() => openCategoryModal(cat)} className="text-blue-500 hover:text-blue-700" title="Modifier">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => deleteCategory(cat.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {productSubTab === 'subcategories' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Gestion des sous-catégories</h2>
                  <button 
                    onClick={() => openSubcategoryModal()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Ajouter une sous-catégorie
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                      <tr>
                        <th className="px-6 py-3">Image</th>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Nom</th>
                        <th className="px-6 py-3">Slug</th>
                        <th className="px-6 py-3">Catégorie Parente</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categories.flatMap(cat => 
                        (cat.subcategories || []).map((sub: any) => (
                          <tr key={sub.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <img src={sub.image || `https://picsum.photos/seed/${sub.slug}/50/50`} alt={sub.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">#{sub.id}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{sub.name}</td>
                            <td className="px-6 py-4 text-gray-500">{sub.slug}</td>
                            <td className="px-6 py-4">{cat.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button onClick={() => openSubcategoryModal(sub)} className="text-blue-500 hover:text-blue-700" title="Modifier">
                                  <Edit size={18} />
                                </button>
                                <button onClick={() => deleteSubcategory(sub.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                                  <Trash2 size={18} />
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
            )}
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Gestion des marques</h2>
              <button 
                onClick={() => openBrandModal()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Ajouter une marque
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="py-3 px-4 border-b border-gray-100 font-medium">Image</th>
                    <th className="py-3 px-4 border-b border-gray-100 font-medium">Nom</th>
                    <th className="py-3 px-4 border-b border-gray-100 font-medium">Slug</th>
                    <th className="py-3 px-4 border-b border-gray-100 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(brand => (
                    <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 border-b border-gray-100">
                        {brand.image ? (
                          <img src={brand.image} alt={brand.name} className="w-12 h-12 object-contain rounded-md border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-100 font-medium text-gray-800">{brand.name}</td>
                      <td className="py-3 px-4 border-b border-gray-100 text-gray-500">{brand.slug}</td>
                      <td className="py-3 px-4 border-b border-gray-100 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openBrandModal(brand)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => deleteBrand(brand.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {brands.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        Aucune marque trouvée. Ajoutez votre première marque !
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Gestion du Slider (Page d'accueil)</h2>
              <button 
                onClick={() => openSlideModal()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Ajouter un slide
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                  <tr>
                    <th className="px-6 py-3">Image</th>
                    <th className="px-6 py-3">Titre</th>
                    <th className="px-6 py-3">Lien</th>
                    <th className="px-6 py-3">Ordre</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {slides.map(slide => (
                    <tr key={slide.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <img src={slide.image} alt={slide.title} className="w-24 h-12 rounded object-cover" referrerPolicy="no-referrer" />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{slide.title}</td>
                      <td className="px-6 py-4 text-gray-500">{slide.link}</td>
                      <td className="px-6 py-4">{slide.order_index}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openSlideModal(slide)} className="text-blue-500 hover:text-blue-700" title="Modifier">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => deleteSlide(slide.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-400 rounded-full mb-4">
              <Users size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Module en développement</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Cette section du back-office est en cours de construction. Elle sera disponible dans la prochaine mise à jour.
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Paramètres de la boutique</h2>
            </div>
            <form onSubmit={handleSettingsSubmit} className="p-6 space-y-6 max-w-2xl">
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Barre d'annonce (Haut de page)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.announcement_phone} 
                      onChange={e => setSettingsForm({...settingsForm, announcement_phone: e.target.value})} 
                      placeholder="+213 555 00 00 00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Texte d'annonce</label>
                    <textarea 
                      rows={2}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.announcement_text} 
                      onChange={e => setSettingsForm({...settingsForm, announcement_text: e.target.value})} 
                      placeholder="🚚 Livraison gratuite à partir de 5 000 DA..."
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={isSavingSettings}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSavingSettings ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.slug} onChange={e => setProductForm({...productForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                  <select required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value, subcategory_id: ''})}>
                    <option value="" disabled>Sélectionner une catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie</label>
                  <select className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.subcategory_id} onChange={e => setProductForm({...productForm, subcategory_id: e.target.value})}>
                    <option value="">Aucune</option>
                    {categories.find(c => c.id.toString() === productForm.category_id.toString())?.subcategories?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <input type="number" required min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
                  <select 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                    value={productForm.brand_id}
                    onChange={e => setProductForm({...productForm, brand_id: e.target.value})}
                  >
                    <option value="">Sélectionner une marque</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix (DA) *</label>
                  <input type="number" required min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix Promo (DA)</label>
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price} onChange={e => setProductForm({...productForm, promo_price: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image Principale</label>
                  <div className="flex items-center gap-4">
                    {productForm.image && (
                      <img src={productForm.image} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                    )}
                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                      <Upload size={18} />
                      Télécharger une image
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const url = await handleFileUpload(e);
                        if (url) setProductForm({...productForm, image: url});
                      }} />
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images Supplémentaires</label>
                  <div className="flex flex-wrap gap-4 mb-2">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img.url || img.image} alt="Extra" className="w-16 h-16 object-cover rounded border" />
                        <button type="button" onClick={() => {
                          const newImages = [...productForm.images];
                          newImages.splice(idx, 1);
                          setProductForm({...productForm, images: newImages});
                        }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 inline-flex items-center gap-2">
                    <Upload size={18} />
                    Ajouter une image
                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                      const url = await handleFileUpload(e);
                      if (url) setProductForm({...productForm, images: [...productForm.images, { url, is_main: false }]});
                    }} />
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points clés (Bullet points)</label>
                  <div className="space-y-2 mb-2">
                    {productForm.key_points.map((point, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Ex: Produit neuf et original" 
                          className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-sm"
                          value={point}
                          onChange={(e) => {
                            const newPoints = [...productForm.key_points];
                            newPoints[idx] = e.target.value;
                            setProductForm({...productForm, key_points: newPoints});
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newPoints = [...productForm.key_points];
                            newPoints.splice(idx, 1);
                            setProductForm({...productForm, key_points: newPoints});
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setProductForm({...productForm, key_points: [...productForm.key_points, '']})}
                    className="text-sm text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
                  >
                    + Ajouter un point clé
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description détaillée</label>
                  <textarea rows={5} className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caractéristiques techniques</label>
                  <div className="space-y-2 mb-2">
                    {productForm.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Clé (ex: Marque)" 
                          className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-sm"
                          value={feature.key}
                          onChange={(e) => {
                            const newFeatures = [...productForm.features];
                            newFeatures[idx].key = e.target.value;
                            setProductForm({...productForm, features: newFeatures});
                          }}
                        />
                        <input 
                          type="text" 
                          placeholder="Valeur (ex: Samsung)" 
                          className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-sm"
                          value={feature.value}
                          onChange={(e) => {
                            const newFeatures = [...productForm.features];
                            newFeatures[idx].value = e.target.value;
                            setProductForm({...productForm, features: newFeatures});
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newFeatures = [...productForm.features];
                            newFeatures.splice(idx, 1);
                            setProductForm({...productForm, features: newFeatures});
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setProductForm({...productForm, features: [...productForm.features, { key: '', value: '' }]})}
                    className="text-sm text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1"
                  >
                    + Ajouter une caractéristique
                  </button>
                </div>
              </div>
              
              <div className="mb-6 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" checked={productForm.is_popular} onChange={e => setProductForm({...productForm, is_popular: e.target.checked})} />
                  Produit Populaire
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" checked={productForm.is_best_seller} onChange={e => setProductForm({...productForm, is_best_seller: e.target.checked})} />
                  Meilleure Vente
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" checked={productForm.is_new} onChange={e => setProductForm({...productForm, is_new: e.target.checked})} />
                  Nouveauté
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" checked={productForm.is_recommended} onChange={e => setProductForm({...productForm, is_recommended: e.target.checked})} />
                  Recommandé
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="rounded text-orange-500 focus:ring-orange-500" checked={productForm.is_fast_delivery} onChange={e => setProductForm({...productForm, is_fast_delivery: e.target.checked})} />
                  Livraison Rapide
                </label>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium transition-colors">
                  {editingProduct ? 'Enregistrer' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Subcategory Modal */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingSubcategory ? 'Modifier la sous-catégorie' : 'Ajouter une sous-catégorie'}</h2>
              <button onClick={() => setIsSubcategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubcategorySubmit} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la sous-catégorie *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subcategoryForm.name} onChange={e => setSubcategoryForm({...subcategoryForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subcategoryForm.slug} onChange={e => setSubcategoryForm({...subcategoryForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie Parente *</label>
                  <select required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subcategoryForm.category_id} onChange={e => setSubcategoryForm({...subcategoryForm, category_id: e.target.value})}>
                    <option value="" disabled>Sélectionner une catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <div className="flex items-center gap-4">
                    {subcategoryForm.image && (
                      <img src={subcategoryForm.image} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                    )}
                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                      <Upload size={18} />
                      Télécharger une image
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const url = await handleFileUpload(e);
                        if (url) setSubcategoryForm({...subcategoryForm, image: url});
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                <button type="button" onClick={() => setIsSubcategoryModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium transition-colors">
                  {editingSubcategory ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la catégorie *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <div className="flex items-center gap-4">
                    {categoryForm.image && (
                      <img src={categoryForm.image} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                    )}
                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                      <Upload size={18} />
                      Télécharger une image
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const url = await handleFileUpload(e);
                        if (url) setCategoryForm({...categoryForm, image: url});
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium transition-colors">
                  {editingCategory ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingBrand ? 'Modifier la marque' : 'Ajouter une marque'}</h2>
              <button onClick={() => setIsBrandModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleBrandSubmit} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la marque</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                    value={brandForm.name}
                    onChange={e => setBrandForm({...brandForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-gray-50"
                    value={brandForm.slug}
                    onChange={e => setBrandForm({...brandForm, slug: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la marque</label>
                  <div className="flex items-center gap-4">
                    {brandForm.image && (
                      <img src={brandForm.image} alt="Preview" className="w-16 h-16 object-contain rounded-md border border-gray-200" />
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const formData = new FormData();
                            formData.append('image', file);
                            
                            try {
                              const token = localStorage.getItem('adminToken');
                              const res = await fetch('/api/admin/upload', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` },
                                body: formData
                              });
                              
                              if (res.ok) {
                                const data = await res.json();
                                setBrandForm({...brandForm, image: data.url});
                              }
                            } catch (err) {
                              console.error("Erreur lors de l'upload", err);
                            }
                          }
                        }}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnelle)</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                    value={brandForm.description}
                    onChange={e => setBrandForm({...brandForm, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  {editingBrand ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSlideModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingSlide ? 'Modifier le slide' : 'Ajouter un slide'}</h2>
              <button onClick={() => setIsSlideModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSlideSubmit} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={slideForm.title} onChange={e => setSlideForm({...slideForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea rows={2} className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={slideForm.description} onChange={e => setSlideForm({...slideForm, description: e.target.value})}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lien (URL)</label>
                  <input type="text" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={slideForm.link} onChange={e => setSlideForm({...slideForm, link: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texte du bouton</label>
                  <input type="text" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={slideForm.button_text} onChange={e => setSlideForm({...slideForm, button_text: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage</label>
                  <input type="number" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={slideForm.order_index} onChange={e => setSlideForm({...slideForm, order_index: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image *</label>
                  <div className="flex flex-col gap-4">
                    {slideForm.image && (
                      <img src={slideForm.image} alt="Preview" className="w-full h-32 object-cover rounded border" />
                    )}
                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2">
                      <Upload size={18} />
                      Télécharger une image
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const url = await handleFileUpload(e);
                        if (url) setSlideForm({...slideForm, image: url});
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
                <button type="button" onClick={() => setIsSlideModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium transition-colors">
                  {editingSlide ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmation</h3>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 transition-colors"
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
