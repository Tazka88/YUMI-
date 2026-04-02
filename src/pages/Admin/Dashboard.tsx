import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, TrendingUp, AlertCircle, Package, Plus, Edit, Trash2, X, Image as ImageIcon, Upload, User } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import FooterSettings from './FooterSettings';
import PageSettings from './PageSettings';
import WilayasSettings from './WilayasSettings';
import { FileText, MapPin, Search, LayoutGrid, List, Printer } from 'lucide-react';
import OrderKanban from './OrderKanban';
import SliderImagesAdmin from './SliderImagesAdmin';

export interface HomeSection {
  id: string;
  type: 'flash_sales' | 'best_sellers' | 'popular' | 'new' | 'custom';
  title: string;
  emoji?: string;
  isVisible: boolean;
  productIds?: string[];
}

const defaultSections: HomeSection[] = [
  { id: 'flash_sales', type: 'flash_sales', title: 'Ventes Flash', isVisible: true },
  { id: 'best_sellers', type: 'best_sellers', title: 'Meilleures Ventes 🏆', isVisible: true },
  { id: 'popular', type: 'popular', title: 'Produits Populaires 🔥', isVisible: true },
  { id: 'new', type: 'new', title: 'Nouveautés 🆕', isVisible: true },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [productSubTab, setProductSubTab] = useState('products');
  const [stats, setStats] = useState({ orders: 0, revenue: 0, lowStock: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderView, setOrderView] = useState<'list' | 'kanban'>('kanban');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubSubcategoryModalOpen, setIsSubSubcategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [editingSubSubcategory, setEditingSubSubcategory] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });
  
  const [productForm, setProductForm] = useState({
    name: '', slug: '', category_id: '', subcategory_id: '', sub_subcategory_id: '', brand_id: '', brand_name: '', price: '', promo_price: '', stock: '', description: '', image: '',
    is_popular: false, is_best_seller: false, is_new: false, is_recommended: false, is_fast_delivery: false, images: [] as any[],
    features: '', key_points: ''
  });
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '', slug: '', category_id: '', image: ''
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '', slug: '', image: '', slide_image: '', mobile_slide_image: ''
  });
  const [subSubcategoryForm, setSubSubcategoryForm] = useState({
    name: '', slug: '', subcategory_id: '', image: ''
  });
  const [brandForm, setBrandForm] = useState({
    name: '', slug: '', image: '', description: ''
  });
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({
    announcement_phone: '', announcement_text: '', announcement_bg_color: '#000000', announcement_text_color: '#ffffff', whatsapp_number: '', admin_email: '', site_logo: '', active_theme: 'normal'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [credentialsForm, setCredentialsForm] = useState({
    currentPassword: '', newUsername: '', newPassword: '', confirmPassword: ''
  });
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const navigate = useNavigate();

  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionEmoji, setNewSectionEmoji] = useState('✨');
  const [editingSectionProducts, setEditingSectionProducts] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.home_sections) {
          try {
            setHomeSections(JSON.parse(data.home_sections));
          } catch (e) {
            setHomeSections(defaultSections);
          }
        } else {
          setHomeSections(defaultSections);
        }
      })
      .catch(() => setHomeSections(defaultSections));
  }, []);

  const saveHomeSections = async (sections: HomeSection[]) => {
    setHomeSections(sections);
    
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ home_sections: JSON.stringify(sections) })
      });
      window.dispatchEvent(new Event('yumi_sections_updated'));
    } catch (err) {
      console.error('Failed to save sections', err);
    }
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSection: HomeSection = {
      id: Date.now().toString(),
      type: 'custom',
      title: newSectionTitle,
      emoji: newSectionEmoji || '✨',
      isVisible: true,
      productIds: []
    };
    saveHomeSections([...homeSections, newSection]);
    setNewSectionTitle('');
    setNewSectionEmoji('✨');
  };

  const handleToggleSection = (id: string) => {
    const updated = homeSections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s);
    saveHomeSections(updated);
  };

  const handleDeleteSection = (id: string) => {
    const updated = homeSections.filter(s => s.id !== id);
    saveHomeSections(updated);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === homeSections.length - 1)
    ) return;

    const newSections = [...homeSections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newSections[index];
    newSections[index] = newSections[swapIndex];
    newSections[swapIndex] = temp;

    saveHomeSections(newSections);
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const headers = { 'Authorization': `Bearer ${token}` };

    const handleFetchError = (err: any) => {
      if (err.name !== 'AbortError') console.error(err);
    };

    if (activeTab === 'overview') {
      fetch('/api/admin/stats', { headers, signal })
        .then(res => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then(setStats)
        .catch(err => {
          if (err.name !== 'AbortError') navigate('/admin/login');
        });
    }

    if (activeTab === 'orders') {
      fetch('/api/admin/orders', { headers, signal })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setOrders(data); })
        .catch(handleFetchError);
    }

    if (activeTab === 'products') {
      fetch('/api/admin/products', { headers, signal })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setProducts(data); })
        .catch(handleFetchError);
      
      fetch('/api/categories', { signal })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setCategories(data); })
        .catch(handleFetchError);

      fetch('/api/brands', { signal })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setBrands(data); })
        .catch(handleFetchError);
    }

    if (activeTab === 'categories') {
      fetch('/api/categories', { signal })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setCategories(data); })
        .catch(handleFetchError);
    }

    if (activeTab === 'brands') {
      fetch('/api/brands', { signal })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setBrands(data); })
        .catch(handleFetchError);
    }

    if (activeTab === 'settings') {
      fetch('/api/admin/settings', { headers, signal })
        .then(res => res.json())
        .then(data => { if (data && typeof data === 'object' && !data.error) setSettingsForm(data); })
        .catch(handleFetchError);
    }
    
    return () => controller.abort();
  }, [navigate, activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return null;

    const toastId = toast.loading('Téléchargement de l\'image...');
    try {
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
        toast.success('Image téléchargée avec succès', { id: toastId });
        return data.url;
      } else {
        const err = await res.json();
        toast.error(`Erreur: ${err.error || 'Échec du téléchargement'}`, { id: toastId });
        return null;
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur de connexion au serveur', { id: toastId });
      return null;
    }
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
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .catch(console.error);
  };

  const deleteOrder = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        try {
          await fetch(`/api/admin/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setOrders(data); })
            .catch(console.error);
          setConfirmModal({ ...confirmModal, isOpen: false });
          toast.success('Commande supprimée avec succès');
        } catch (err) {
          console.error(err);
          toast.error('Erreur lors de la suppression de la commande');
        }
      }
    });
  };

  const printOrder = async (id: number) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orderData = await res.json();
      
      if (!res.ok) throw new Error(orderData.error);

      // Create a print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Veuillez autoriser les popups pour imprimer');
        return;
      }

      const itemsHtml = orderData.items.map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price} DA</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price * item.quantity} DA</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Commande ${orderData.order_id || '#' + orderData.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6; }
            .logo { font-size: 24px; font-weight: bold; color: #f97316; }
            .invoice-details { text-align: right; }
            .invoice-title { font-size: 28px; font-weight: bold; margin: 0 0 10px 0; color: #111; text-transform: uppercase; }
            .customer-info { margin-bottom: 40px; background: #f9fafb; padding: 20px; border-radius: 8px; }
            .customer-info h3 { margin-top: 0; color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
            table { w-full; border-collapse: collapse; margin-bottom: 30px; width: 100%; }
            th { text-align: left; padding: 12px 10px; background-color: #f9fafb; color: #4b5563; font-weight: 600; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
            .totals { width: 300px; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total-row.final { font-weight: bold; font-size: 18px; border-bottom: none; border-top: 2px solid #111; padding-top: 15px; margin-top: 5px; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 14px; padding-top: 20px; border-top: 1px solid #eee; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Yumi Store</div>
              <div style="color: #6b7280; margin-top: 5px;">Boutique en ligne</div>
            </div>
            <div class="invoice-details">
              <h1 class="invoice-title">Bon de Livraison</h1>
              <div><strong>Commande:</strong> ${orderData.order_id || '#' + orderData.id}</div>
              <div><strong>Date:</strong> ${new Date(orderData.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          <div class="customer-info">
            <h3>Informations Client</h3>
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${orderData.customer_name}</div>
            <div><strong>Téléphone:</strong> ${orderData.customer_phone}</div>
            <div><strong>Wilaya:</strong> ${orderData.wilaya}</div>
            <div><strong>Adresse:</strong> ${orderData.address}</div>
            ${orderData.note ? `<div style="margin-top: 10px;"><strong>Note:</strong> ${orderData.note}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th style="text-align: center;">Qté</th>
                <th style="text-align: right;">Prix Unitaire</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Sous-total</span>
              <span>${orderData.total_amount - orderData.delivery_cost} DA</span>
            </div>
            <div class="total-row">
              <span>Frais de livraison</span>
              <span>${orderData.delivery_cost} DA</span>
            </div>
            <div class="total-row final">
              <span>Total à payer</span>
              <span>${orderData.total_amount} DA</span>
            </div>
          </div>

          <div class="footer">
            Merci pour votre commande !
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la préparation de l\'impression');
    }
  };

  const handleSelectAllOrders = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const filteredOrders = orders.filter(order => 
        (orderStatusFilter === 'all' || order.status === orderStatusFilter) &&
        (!orderSearchTerm || 
        (order.order_id && order.order_id.toLowerCase().includes(orderSearchTerm.toLowerCase())) || 
        order.id.toString().includes(orderSearchTerm) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
        (order.customer_phone && order.customer_phone.includes(orderSearchTerm)))
      );
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id: number) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      message: `Êtes-vous sûr de vouloir supprimer ${selectedOrders.length} commande(s) ? Cette action est irréversible.`,
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        try {
          // Delete sequentially to avoid overwhelming the server
          for (const id of selectedOrders) {
            await fetch(`/api/admin/orders/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          }
          
          toast.success(`${selectedOrders.length} commande(s) supprimée(s)`);
          setSelectedOrders([]);
          
          // Refresh orders
          fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setOrders(data); })
            .catch(console.error);
            
        } catch (err) {
          console.error(err);
          toast.error('Erreur lors de la suppression groupée');
        }
      }
    });
  };

  const handleBulkPrint = async () => {
    if (selectedOrders.length === 0) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      // Fetch all selected orders details
      const ordersData = [];
      for (const id of selectedOrders) {
        const res = await fetch(`/api/admin/orders/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          ordersData.push(await res.json());
        }
      }
      
      if (ordersData.length === 0) {
        toast.error('Aucune commande trouvée pour l\'impression');
        return;
      }

      // Create a print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Veuillez autoriser les popups pour imprimer');
        return;
      }

      // Generate HTML for all orders
      const allOrdersHtml = ordersData.map(orderData => {
        const itemsHtml = orderData.items.map((item: any) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price} DA</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price * item.quantity} DA</td>
          </tr>
        `).join('');

        return `
          <div class="page-break">
            <div class="header">
              <div>
                <div class="logo">Yumi Store</div>
                <div style="color: #6b7280; margin-top: 5px;">Boutique en ligne</div>
              </div>
              <div class="invoice-details">
                <h1 class="invoice-title">Bon de Livraison</h1>
                <div><strong>Commande:</strong> ${orderData.order_id || '#' + orderData.id}</div>
                <div><strong>Date:</strong> ${new Date(orderData.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>

            <div class="customer-info">
              <h3>Informations Client</h3>
              <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <div>
                  <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${orderData.customer_name}</div>
                  <div style="color: #4b5563; margin-bottom: 3px;">${orderData.customer_phone}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: bold; margin-bottom: 5px;">Adresse de livraison</div>
                  <div style="color: #4b5563;">${orderData.address}</div>
                  <div style="color: #4b5563;">${orderData.wilaya}</div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th style="text-align: center; width: 80px;">Qté</th>
                  <th style="text-align: right; width: 120px;">Prix Unitaire</th>
                  <th style="text-align: right; width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span style="color: #6b7280;">Sous-total</span>
                <span>${orderData.total_amount - (orderData.delivery_cost || 0)} DA</span>
              </div>
              <div class="total-row">
                <span style="color: #6b7280;">Frais de livraison</span>
                <span>${orderData.delivery_cost || 0} DA</span>
              </div>
              <div class="total-row final">
                <span>Total à payer</span>
                <span>${orderData.total_amount} DA</span>
              </div>
            </div>

            <div class="footer">
              Merci pour votre confiance !<br>
              Pour toute question, veuillez nous contacter.
            </div>
          </div>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Impression de ${ordersData.length} commande(s)</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            .page-break { page-break-after: always; margin-bottom: 50px; }
            .page-break:last-child { page-break-after: auto; margin-bottom: 0; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6; }
            .logo { font-size: 24px; font-weight: bold; color: #f97316; }
            .invoice-details { text-align: right; }
            .invoice-title { font-size: 28px; font-weight: bold; margin: 0 0 10px 0; color: #111; text-transform: uppercase; }
            .customer-info { margin-bottom: 40px; background: #f9fafb; padding: 20px; border-radius: 8px; }
            .customer-info h3 { margin-top: 0; color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
            table { border-collapse: collapse; margin-bottom: 30px; width: 100%; }
            th { text-align: left; padding: 12px 10px; background-color: #f9fafb; color: #4b5563; font-weight: 600; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
            .totals { width: 300px; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total-row.final { font-weight: bold; font-size: 18px; border-bottom: none; border-top: 2px solid #111; padding-top: 15px; margin-top: 5px; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 14px; padding-top: 20px; border-top: 1px solid #eee; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="text-align: right; margin-bottom: 20px;">
            <button onclick="window.print()" style="background: #f97316; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Imprimer toutes les commandes</button>
          </div>
          ${allOrdersHtml}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      
      // Clear selection after printing
      setSelectedOrders([]);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la préparation de l\'impression groupée');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'nouvelle': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmée': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expédiée': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'livrée': return 'bg-green-100 text-green-800 border-green-200';
      case 'annulée': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    if (status.toLowerCase() === 'nouvelle') return 'En attente';
    return status;
  };

  const openModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name, slug: product.slug, category_id: product.category_id, subcategory_id: product.subcategory_id || '', sub_subcategory_id: product.sub_subcategory_id || '', brand_id: product.brand_id || '', brand_name: product.brand_name || '',
        price: product.price, promo_price: product.promo_price || '', stock: product.stock, 
        description: product.description || '', image: product.image || '',
        is_popular: !!product.is_popular, is_best_seller: !!product.is_best_seller, 
        is_new: !!product.is_new, is_recommended: !!product.is_recommended,
        is_fast_delivery: !!product.is_fast_delivery,
        images: product.images || [],
        features: typeof product.features === 'string' ? product.features : (Array.isArray(product.features) ? product.features.map((f: any) => `${f.key}: ${f.value}`).join('\n') : ''),
        key_points: typeof product.key_points === 'string' ? product.key_points : (Array.isArray(product.key_points) ? product.key_points.join('\n') : '')
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', slug: '', category_id: categories[0]?.id || '', subcategory_id: '', sub_subcategory_id: '', brand_id: '', brand_name: '', price: '', promo_price: '', stock: '', description: '', image: '',
        is_popular: false, is_best_seller: false, is_new: false, is_recommended: false, is_fast_delivery: false, images: [], features: '', key_points: ''
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

  const openSubSubcategoryModal = (subSubcategory: any = null) => {
    if (subSubcategory) {
      setEditingSubSubcategory(subSubcategory);
      setSubSubcategoryForm({
        name: subSubcategory.name, slug: subSubcategory.slug, subcategory_id: subSubcategory.subcategory_id, image: subSubcategory.image || ''
      });
    } else {
      setEditingSubSubcategory(null);
      const firstSubcat = categories.flatMap(c => c.subcategories || [])[0];
      setSubSubcategoryForm({
        name: '', slug: '', subcategory_id: firstSubcat?.id || '', image: ''
      });
    }
    setIsSubSubcategoryModalOpen(true);
  };

  const openCategoryModal = (category: any = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name, slug: category.slug, image: category.image || '', slide_image: category.slide_image || '', mobile_slide_image: category.mobile_slide_image || ''
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '', slug: '', image: '', slide_image: '', mobile_slide_image: ''
      });
    }
    setIsCategoryModalOpen(true);
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

    let parsedFeatures: any = productForm.features;
    if (typeof productForm.features === 'string' && productForm.features.trim()) {
      const lines = productForm.features.split('\n').filter(line => line.trim());
      const hasColons = lines.some(line => line.includes(':'));
      
      if (hasColons) {
        parsedFeatures = lines.map(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            return { key: parts[0].trim(), value: parts.slice(1).join(':').trim() };
          }
          return { key: '', value: line.trim() };
        });
      }
    }

    const payload = {
      ...productForm,
      subcategory_id: productForm.subcategory_id || null,
      sub_subcategory_id: productForm.sub_subcategory_id || null,
      brand_id: productForm.brand_id || null,
      price: parseFloat(productForm.price as string),
      promo_price: productForm.promo_price ? parseFloat(productForm.promo_price as string) : null,
      stock: parseInt(productForm.stock as string, 10),
      features: parsedFeatures,
      key_points: typeof productForm.key_points === 'string' 
        ? productForm.key_points.split('\n').map(p => p.trim()).filter(p => p) 
        : productForm.key_points
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Erreur: ${errorData.error || 'Impossible de sauvegarder le produit'}`);
        return;
      }

      setIsModalOpen(false);
      fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setProducts(data); })
        .catch(console.error);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de connexion au serveur');
    }
  };

  const deleteProduct = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer ce produit ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        try {
          await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setProducts(data); })
            .catch(console.error);
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingSubcategory ? `/api/admin/subcategories/${editingSubcategory.id}` : '/api/admin/subcategories';
    const method = editingSubcategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subcategoryForm)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Erreur: ${errorData.error || 'Impossible de sauvegarder la sous-catégorie'}`);
        return;
      }

      setIsSubcategoryModalOpen(false);
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setCategories(data); })
        .catch(console.error);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de connexion au serveur');
    }
  };

  const handleSubSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingSubSubcategory ? `/api/admin/sub_subcategories/${editingSubSubcategory.id}` : '/api/admin/sub_subcategories';
    const method = editingSubSubcategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subSubcategoryForm)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Erreur: ${errorData.error || 'Impossible de sauvegarder la sous-sous-catégorie'}`);
        return;
      }

      setIsSubSubcategoryModalOpen(false);
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setCategories(data); })
        .catch(console.error);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de connexion au serveur');
    }
  };

  const deleteSubcategory = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        try {
          await fetch(`/api/admin/subcategories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetch('/api/categories')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setCategories(data); })
            .catch(console.error);
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const deleteSubSubcategory = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer cette sous-sous-catégorie ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        try {
          await fetch(`/api/admin/sub_subcategories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetch('/api/categories')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setCategories(data); })
            .catch(console.error);
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(categoryForm)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Erreur: ${errorData.error || 'Impossible de sauvegarder la catégorie'}`);
        return;
      }

      setIsCategoryModalOpen(false);
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setCategories(data); })
        .catch(console.error);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de connexion au serveur');
    }
  };

  const deleteCategory = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
      onConfirm: async () => {
        const token = localStorage.getItem('adminToken');
        try {
          await fetch(`/api/admin/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetch('/api/categories')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setCategories(data); })
            .catch(console.error);
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const url = editingBrand ? `/api/admin/brands/${editingBrand.id}` : '/api/admin/brands';
    const method = editingBrand ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(brandForm)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Erreur: ${errorData.error || 'Impossible de sauvegarder la marque'}`);
        return;
      }

      setIsBrandModalOpen(false);
      fetch('/api/brands')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setBrands(data); })
        .catch(console.error);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de connexion au serveur');
    }
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
          toast.error(data.error || "Erreur lors de la suppression");
          setConfirmModal({ ...confirmModal, isOpen: false });
          return;
        }
        
        fetch('/api/brands')
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setBrands(data); })
          .catch(console.error);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSavingSettings(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settingsForm)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur serveur');
      }
      
      toast.success('Paramètres enregistrés avec succès !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde des paramètres.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    if (settingsForm.admin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingsForm.admin_email)) {
      toast.error("Veuillez entrer une adresse email valide.");
      return;
    }
    
    setIsSavingSettings(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ admin_email: settingsForm.admin_email })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur serveur');
      }
      
      toast.success('Email modifié avec succès');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde de l\'email.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentialsForm.currentPassword) {
      toast.error("Le mot de passe actuel est requis.");
      return;
    }
    
    if (credentialsForm.newPassword && credentialsForm.newPassword !== credentialsForm.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    
    setIsSavingCredentials(true);
    const token = localStorage.getItem('adminToken');
    
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: credentialsForm.currentPassword,
          newUsername: credentialsForm.newUsername || undefined,
          newPassword: credentialsForm.newPassword || undefined
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }
      
      toast.success('Identifiants modifiés avec succès. Veuillez vous reconnecter.');
      setCredentialsForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
      handleLogout();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde des identifiants.');
    } finally {
      setIsSavingCredentials(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          {settingsForm.site_logo ? (
            <img src={settingsForm.site_logo} alt="Yumi Logo" className="h-8 w-auto object-contain" />
          ) : (
            <>
              <div className="bg-orange-500 text-white px-2 py-1 rounded-md font-black italic text-xl">Y</div>
              <span className="text-xl font-bold tracking-tight">Yumi Admin</span>
            </>
          )}
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
            onClick={() => setActiveTab('wilayas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'wilayas' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <MapPin size={20} />
            Wilayas & Livraison
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'settings' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Settings size={20} />
            Paramètres
          </button>
          <button 
            onClick={() => setActiveTab('pages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'pages' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <FileText size={20} />
            Gestion des Pages
          </button>
          <button 
            onClick={() => setActiveTab('sections')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'sections' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Sections Accueil
          </button>
          <button 
            onClick={() => setActiveTab('footer')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'footer' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Gestion du Footer
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'account' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <User size={20} />
            Compte administrateur
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
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{order.order_id || `#${order.id}`}</td>
                        <td className="px-6 py-4">{order.customer_name}</td>
                        <td className="px-6 py-4">{order.wilaya}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(order.total_amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                            {formatStatus(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => printOrder(order.id)}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              title="Imprimer"
                            >
                              <Printer size={16} />
                            </button>
                            <button 
                              onClick={() => deleteOrder(order.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
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
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800">Gestion des commandes</h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input 
                    type="text" 
                    placeholder="Rechercher par ID ou nom..." 
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setOrderView('list')}
                    className={`p-1.5 rounded-md transition-colors ${orderView === 'list' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Vue Liste"
                  >
                    <List size={18} />
                  </button>
                  <button
                    onClick={() => setOrderView('kanban')}
                    className={`p-1.5 rounded-md transition-colors ${orderView === 'kanban' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Vue Kanban"
                  >
                    <LayoutGrid size={18} />
                  </button>
                </div>
              </div>
            </div>
            
            {orderView === 'kanban' ? (
              <div className="p-6 bg-gray-50">
                <OrderKanban 
                  orders={orders} 
                  updateOrderStatus={updateOrderStatus} 
                  orderSearchTerm={orderSearchTerm} 
                  onDeleteOrder={deleteOrder}
                  onPrintOrder={printOrder}
                />
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex overflow-x-auto border-b border-gray-200 px-6 pt-2 hide-scrollbar">
                  {[
                    { id: 'all', label: 'Toutes' },
                    { id: 'nouvelle', label: 'En attente' },
                    { id: 'confirmée', label: 'Confirmée' },
                    { id: 'expédiée', label: 'Expédiée' },
                    { id: 'livrée', label: 'Livrée' },
                    { id: 'annulée', label: 'Annulée' }
                  ].map(tab => {
                    const count = tab.id === 'all' ? orders.length : orders.filter(o => o.status === tab.id).length;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setOrderStatusFilter(tab.id)}
                        className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                          orderStatusFilter === tab.id
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          orderStatusFilter === tab.id ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="overflow-x-auto">
                  {selectedOrders.length > 0 && (
                    <div className="bg-orange-50 p-3 mb-4 rounded-lg border border-orange-100 flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-800">
                        {selectedOrders.length} commande(s) sélectionnée(s)
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleBulkPrint}
                          className="text-sm bg-white border border-orange-200 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-100 transition-colors"
                        >
                          Imprimer la sélection
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors"
                        >
                          Supprimer la sélection
                        </button>
                      </div>
                    </div>
                  )}
                  <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-medium">
                    <tr>
                      <th className="px-6 py-3 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          checked={
                            orders.filter(order => 
                              (orderStatusFilter === 'all' || order.status === orderStatusFilter) &&
                              (!orderSearchTerm || 
                              (order.order_id && order.order_id.toLowerCase().includes(orderSearchTerm.toLowerCase())) || 
                              order.id.toString().includes(orderSearchTerm) ||
                              (order.customer_name && order.customer_name.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
                              (order.customer_phone && order.customer_phone.includes(orderSearchTerm)))
                            ).length > 0 && 
                            selectedOrders.length === orders.filter(order => 
                              (orderStatusFilter === 'all' || order.status === orderStatusFilter) &&
                              (!orderSearchTerm || 
                              (order.order_id && order.order_id.toLowerCase().includes(orderSearchTerm.toLowerCase())) || 
                              order.id.toString().includes(orderSearchTerm) ||
                              (order.customer_name && order.customer_name.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
                              (order.customer_phone && order.customer_phone.includes(orderSearchTerm)))
                            ).length
                          }
                          onChange={handleSelectAllOrders}
                        />
                      </th>
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
                    {orders.filter(order => 
                      (orderStatusFilter === 'all' || order.status === orderStatusFilter) &&
                      (!orderSearchTerm || 
                      (order.order_id && order.order_id.toLowerCase().includes(orderSearchTerm.toLowerCase())) || 
                      order.id.toString().includes(orderSearchTerm) ||
                      (order.customer_name && order.customer_name.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
                      (order.customer_phone && order.customer_phone.includes(orderSearchTerm)))
                    ).map(order => (
                      <tr key={order.id} className={`hover:bg-gray-50 ${selectedOrders.includes(order.id) ? 'bg-orange-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{order.order_id || `#${order.id}`}</td>
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
                          <option value="nouvelle">En attente</option>
                          <option value="confirmée">Confirmée</option>
                          <option value="expédiée">Expédiée</option>
                          <option value="livrée">Livrée</option>
                          <option value="annulée">Annulée</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => printOrder(order.id)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Imprimer"
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            onClick={() => deleteOrder(order.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
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
              <button 
                onClick={() => setProductSubTab('sub_subcategories')} 
                className={`pb-2 px-2 font-medium text-sm transition-colors ${productSubTab === 'sub_subcategories' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Sous-sous-catégories
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
                        <th className="px-6 py-3">Nom du produit</th>
                        <th className="px-6 py-3">Catégorie</th>
                        <th className="px-6 py-3">Sous-catégorie</th>
                        <th className="px-6 py-3">Sous-sous-catégorie</th>
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
                            <img src={product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=50`} alt={product.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4">{product.category_name}</td>
                          <td className="px-6 py-4 text-gray-500">{product.subcategory_name || '-'}</td>
                          <td className="px-6 py-4 text-gray-500">{product.sub_subcategory_name || '-'}</td>
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
                            <img src={cat.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=random&size=50`} alt={cat.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
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
                              <img src={sub.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name)}&background=random&size=50`} alt={sub.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
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

            {productSubTab === 'sub_subcategories' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Gestion des sous-sous-catégories</h2>
                  <button 
                    onClick={() => openSubSubcategoryModal()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                  >
                    <Plus size={18} />
                    Ajouter une sous-sous-catégorie
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
                        <th className="px-6 py-3">Sous-catégorie Parente</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categories.flatMap(cat => 
                        (cat.subcategories || []).flatMap((sub: any) => 
                          (sub.sub_subcategories || []).map((ss: any) => (
                            <tr key={ss.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <img src={ss.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(ss.name)}&background=random&size=50`} alt={ss.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-900">#{ss.id}</td>
                              <td className="px-6 py-4 font-medium text-gray-900">{ss.name}</td>
                              <td className="px-6 py-4 text-gray-500">{ss.slug}</td>
                              <td className="px-6 py-4">{sub.name}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <button onClick={() => openSubSubcategoryModal(ss)} className="text-blue-500 hover:text-blue-700" title="Modifier">
                                    <Edit size={18} />
                                  </button>
                                  <button onClick={() => deleteSubSubcategory(ss.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )
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
                          <img src={brand.image} alt={brand.name} className="w-12 h-12 object-contain p-1 rounded-md border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 p-[15px]">
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
          <SliderImagesAdmin />
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

        {activeTab === 'wilayas' && <WilayasSettings />}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Paramètres de la boutique</h2>
            </div>
            <form onSubmit={handleSettingsSubmit} className="p-6 space-y-6 max-w-2xl">
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Logo du site</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo actuel</label>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                        {settingsForm.site_logo ? (
                          <img src={settingsForm.site_logo} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-sm text-gray-400">Par défaut</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors text-center">
                          <Upload size={16} className="inline mr-2" />
                          Changer le logo
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setSettingsForm({...settingsForm, site_logo: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {settingsForm.site_logo && (
                          <button 
                            type="button"
                            onClick={() => setSettingsForm({...settingsForm, site_logo: ''})}
                            className="text-red-600 text-sm hover:underline text-left"
                          >
                            Réinitialiser par défaut
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Formats acceptés : PNG, JPG, SVG. Le logo sera appliqué instantanément après sauvegarde.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Thème Saisonnier</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thème Actif</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      value={settingsForm.active_theme || 'normal'}
                      onChange={e => setSettingsForm({...settingsForm, active_theme: e.target.value})}
                    >
                      <option value="normal">Normal (Défaut)</option>
                      <option value="ramadan">Ramadan</option>
                      <option value="aid">Aïd</option>
                      <option value="independance">Fête de l'Indépendance</option>
                      <option value="yennayer">Yennayer (Nouvel An Amazigh)</option>
                      <option value="mouloud">El Mouloud</option>
                      <option value="rentree">Rentrée Scolaire</option>
                      <option value="soldes">Soldes</option>
                      <option value="ete">Été</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                      Change l'apparence de la page d'accueil avec des couleurs et images adaptées à la saison.
                    </p>
                  </div>
                  
                  {settingsForm.active_theme && settingsForm.active_theme !== 'normal' && (
                    <>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">Intensité de l'overlay</label>
                          <span className="text-sm font-bold text-orange-500">{settingsForm.overlay_intensity ?? 60}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500">0</span>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={settingsForm.overlay_intensity ?? 60}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setSettingsForm({...settingsForm, overlay_intensity: val});
                              
                              const token = localStorage.getItem('adminToken');
                              fetch('/api/admin/settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({...settingsForm, overlay_intensity: val})
                              }).catch(console.error);
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <span className="text-xs text-gray-500">100</span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">0 = image pure, zéro filtre | 100 = filtre maximum</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image de fond personnalisée pour le thème {settingsForm.active_theme}</label>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                          {settingsForm[`theme_image_${settingsForm.active_theme}`] ? (
                            <img src={settingsForm[`theme_image_${settingsForm.active_theme}`]} alt="Theme preview" className="max-w-full max-h-full object-cover" />
                          ) : (
                            <span className="text-sm text-gray-400 text-center px-2">Image par défaut</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors text-center">
                            <Upload size={16} className="inline mr-2" />
                            Uploader une image
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={async (e) => {
                                const url = await handleFileUpload(e);
                                if (url) setSettingsForm({...settingsForm, [`theme_image_${settingsForm.active_theme}`]: url});
                              }} 
                            />
                          </label>
                          {settingsForm[`theme_image_${settingsForm.active_theme}`] && (
                            <button 
                              type="button"
                              onClick={() => setSettingsForm({...settingsForm, [`theme_image_${settingsForm.active_theme}`]: ''})}
                              className="text-red-500 text-sm hover:underline text-left"
                            >
                              Supprimer l'image
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Format recommandé : JPG/WebP, 1600x900px, max 500KB. Si vous laissez vide, l'image par défaut sera utilisée.</p>
                    </div>
                    </>
                  )}
                </div>
              </div>

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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Texte d'annonce (un message par ligne)</label>
                    <textarea 
                      rows={4}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.announcement_text} 
                      onChange={e => setSettingsForm({...settingsForm, announcement_text: e.target.value})} 
                      placeholder="📞 Appelez pour commander : 05 22 04 18 18&#10;🚚 Livraison à partir de 149 Dhs&#10;🎉 Spécial Aïd - Jusqu'à -70%"
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">Chaque ligne s'affichera pendant 3 secondes avec une animation.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Couleur de fond</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          className="h-10 w-10 rounded cursor-pointer border-0 p-0" 
                          value={settingsForm.announcement_bg_color || '#000000'} 
                          onChange={e => setSettingsForm({...settingsForm, announcement_bg_color: e.target.value})} 
                        />
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                          value={settingsForm.announcement_bg_color || '#000000'} 
                          onChange={e => setSettingsForm({...settingsForm, announcement_bg_color: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du texte</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          className="h-10 w-10 rounded cursor-pointer border-0 p-0" 
                          value={settingsForm.announcement_text_color || '#ffffff'} 
                          onChange={e => setSettingsForm({...settingsForm, announcement_text_color: e.target.value})} 
                        />
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                          value={settingsForm.announcement_text_color || '#ffffff'} 
                          onChange={e => setSettingsForm({...settingsForm, announcement_text_color: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Bouton WhatsApp</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro WhatsApp (avec indicatif, ex: 213555000000)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.whatsapp_number || ''} 
                      onChange={e => setSettingsForm({...settingsForm, whatsapp_number: e.target.value})} 
                      placeholder="213555000000"
                    />
                    <p className="text-sm text-gray-500 mt-1">Ce numéro sera utilisé pour le bouton WhatsApp flottant sur le site.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Intégrations Marketing</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics (ID de mesure)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.ga_measurement_id || ''} 
                      onChange={e => setSettingsForm({...settingsForm, ga_measurement_id: e.target.value})} 
                      placeholder="G-XXXXXXXXXX"
                    />
                    <p className="text-sm text-gray-500 mt-1">Laissez vide pour désactiver Google Analytics.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Pixel ID</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.fb_pixel_id || ''} 
                      onChange={e => setSettingsForm({...settingsForm, fb_pixel_id: e.target.value})} 
                      placeholder="123456789012345"
                    />
                    <p className="text-sm text-gray-500 mt-1">Laissez vide pour désactiver le Pixel Facebook.</p>
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

        {activeTab === 'account' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Compte administrateur</h2>
            </div>
            <form onSubmit={handleEmailSubmit} className="p-6 space-y-6 max-w-2xl">
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Notifications et Contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email administrateur</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.admin_email || ''} 
                      onChange={e => setSettingsForm({...settingsForm, admin_email: e.target.value})} 
                      placeholder="nom@exemple.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">Cet email sera utilisé pour recevoir les commandes des clients et les messages via le formulaire de contact.</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={isSavingSettings}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSavingSettings ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </form>

            <form onSubmit={handleCredentialsSubmit} className="p-6 space-y-6 max-w-2xl border-t border-gray-100">
              <div>
                <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Modifier les identifiants</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel (requis)</label>
                    <input 
                      type="password" 
                      required
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={credentialsForm.currentPassword} 
                      onChange={e => setCredentialsForm({...credentialsForm, currentPassword: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau nom d'utilisateur (optionnel)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={credentialsForm.newUsername} 
                      onChange={e => setCredentialsForm({...credentialsForm, newUsername: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe (optionnel)</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={credentialsForm.newPassword} 
                      onChange={e => setCredentialsForm({...credentialsForm, newPassword: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={credentialsForm.confirmPassword} 
                      onChange={e => setCredentialsForm({...credentialsForm, confirmPassword: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={isSavingCredentials}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSavingCredentials ? 'Enregistrement...' : 'Modifier les identifiants'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'footer' && (
          <FooterSettings />
        )}

        {activeTab === 'pages' && (
          <PageSettings />
        )}

        {activeTab === 'sections' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Sections Accueil</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {homeSections.map((section, index) => (
                  <div key={section.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-orange-500 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === homeSections.length - 1}
                          className="text-gray-400 hover:text-orange-500 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{section.emoji}</span>
                        <span className="font-medium text-gray-800">{section.title}</span>
                        {section.type !== 'custom' && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Par défaut</span>
                        )}
                        {section.type === 'custom' && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            {section.productIds?.length || 0} produits
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {section.type === 'custom' && (
                        <button 
                          onClick={() => {
                            setEditingSectionProducts(section.id);
                            setSelectedProducts(section.productIds || []);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <ShoppingBag size={16} />
                          Gérer les produits
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleSection(section.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${section.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {section.isVisible ? 'ON ●' : 'OFF ○'}
                      </button>
                      <button 
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                        title={section.type !== 'custom' ? "Vous pouvez seulement masquer les sections par défaut" : "Supprimer"}
                        disabled={section.type !== 'custom'}
                        style={{ opacity: section.type !== 'custom' ? 0.3 : 1 }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {homeSections.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Aucune section personnalisée. Ajoutez-en une ci-dessous.</p>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-sm font-bold text-gray-800 mb-4">+ Ajouter une section</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Titre de la section (ex: Moins de 1000 DA)"
                      value={newSectionTitle}
                      onChange={e => setNewSectionTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="w-24">
                    <input 
                      type="text" 
                      placeholder="Emoji"
                      value={newSectionEmoji}
                      onChange={e => setNewSectionEmoji(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-center"
                    />
                  </div>
                  <button 
                    onClick={handleAddSection}
                    className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium transition-colors"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit *</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                    value={productForm.name} 
                    onChange={e => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                      setProductForm({...productForm, name, slug});
                    }} 
                  />
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
                  <select className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.subcategory_id} onChange={e => setProductForm({...productForm, subcategory_id: e.target.value, sub_subcategory_id: ''})}>
                    <option value="">Aucune</option>
                    {categories.find(c => c.id.toString() === productForm.category_id.toString())?.subcategories?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sous-sous-catégorie</label>
                  <select className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.sub_subcategory_id} onChange={e => setProductForm({...productForm, sub_subcategory_id: e.target.value})}>
                    <option value="">Aucune</option>
                    {categories.find(c => c.id.toString() === productForm.category_id.toString())?.subcategories?.find((s: any) => s.id.toString() === productForm.subcategory_id.toString())?.sub_subcategories?.map((ss: any) => (
                      <option key={ss.id} value={ss.id}>{ss.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
                  <select 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                    value={productForm.brand_id}
                    onChange={e => {
                      const selectedBrand = brands.find(b => b.id.toString() === e.target.value);
                      setProductForm({
                        ...productForm, 
                        brand_id: e.target.value, 
                        brand_name: selectedBrand ? selectedBrand.name : ''
                      });
                    }}
                  >
                    <option value="">Aucune marque</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {!productForm.brand_id && productForm.brand_name && (
                    <p className="text-xs text-orange-500 mt-1">
                      Marque actuelle (texte libre) : {productForm.brand_name}. Veuillez sélectionner une marque dans la liste pour la lier à la page de la marque.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix (DA) *</label>
                  <input type="number" required min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix Promo (DA)</label>
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price} onChange={e => setProductForm({...productForm, promo_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <input type="number" required min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description détaillée</label>
                  <textarea rows={5} className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caractéristiques techniques</label>
                  <textarea rows={5} placeholder="Entrez les caractéristiques techniques ici..." className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.features as string} onChange={e => setProductForm({...productForm, features: e.target.value})}></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points clés (un par ligne)</label>
                  <textarea rows={5} placeholder="Entrez les points clés ici..." className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.key_points as string} onChange={e => setProductForm({...productForm, key_points: e.target.value})}></textarea>
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
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 p-6 shrink-0 bg-gray-50 rounded-b-xl">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors bg-white">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{editingSubcategory ? 'Modifier la sous-catégorie' : 'Ajouter une sous-catégorie'}</h2>
              <button onClick={() => setIsSubcategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubcategorySubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
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
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 p-6 shrink-0 bg-gray-50 rounded-b-xl">
                <button type="button" onClick={() => setIsSubcategoryModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors bg-white">
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

      {/* Sub-subcategory Modal */}
      {isSubSubcategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{editingSubSubcategory ? 'Modifier la sous-sous-catégorie' : 'Ajouter une sous-sous-catégorie'}</h2>
              <button onClick={() => setIsSubSubcategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubSubcategorySubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la sous-sous-catégorie *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subSubcategoryForm.name} onChange={e => setSubSubcategoryForm({...subSubcategoryForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
                  <input type="text" required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subSubcategoryForm.slug} onChange={e => setSubSubcategoryForm({...subSubcategoryForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie Parente *</label>
                  <select required className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subSubcategoryForm.subcategory_id} onChange={e => setSubSubcategoryForm({...subSubcategoryForm, subcategory_id: e.target.value})}>
                    <option value="" disabled>Sélectionner une sous-catégorie</option>
                    {categories.flatMap(c => c.subcategories || []).map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <div className="flex items-center gap-4">
                    {subSubcategoryForm.image && (
                      <img src={subSubcategoryForm.image} alt="Preview" className="w-16 h-16 object-cover rounded-md border border-gray-200" referrerPolicy="no-referrer" />
                    )}
                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                      <Upload size={18} />
                      Télécharger une image
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const url = await handleFileUpload(e);
                        if (url) setSubSubcategoryForm({...subSubcategoryForm, image: url});
                      }} />
                    </label>
                  </div>
                </div>
              </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 p-6 shrink-0 bg-gray-50 rounded-b-xl">
                <button type="button" onClick={() => setIsSubSubcategoryModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors bg-white">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium transition-colors">
                  {editingSubSubcategory ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image d'accueil (Miniature)</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image Slide (Bannière dédiée ordinateur)</label>
                  <div className="flex items-center gap-4">
                    {categoryForm.slide_image && (
                      <img src={categoryForm.slide_image} alt="Slide Preview" className="w-32 h-16 object-cover rounded border" />
                    )}
                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                      <Upload size={18} />
                      Télécharger une bannière
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const url = await handleFileUpload(e);
                        if (url) setCategoryForm({...categoryForm, slide_image: url});
                      }} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image Slide Mobile (Optionnel, 4:5)</label>
                  <div className="flex items-center gap-4">
                    {categoryForm.mobile_slide_image && (
                      <img src={categoryForm.mobile_slide_image} alt="Mobile Slide Preview" className="w-16 h-20 object-cover rounded border" />
                    )}
                    <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                      <Upload size={18} />
                      Télécharger une bannière mobile
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const url = await handleFileUpload(e);
                        if (url) setCategoryForm({...categoryForm, mobile_slide_image: url});
                      }} />
                    </label>
                  </div>
                </div>
              </div>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 p-6 shrink-0 bg-gray-50 rounded-b-xl">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors bg-white">
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

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{editingBrand ? 'Modifier la marque' : 'Ajouter une marque'}</h2>
              <button onClick={() => setIsBrandModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleBrandSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
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
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 p-6 shrink-0 bg-gray-50 rounded-b-xl">
                <button 
                  type="button" 
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors bg-white border border-gray-300"
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
      {/* Section Products Modal */}
      {editingSectionProducts && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Sélectionner les produits</h2>
              <button onClick={() => setEditingSectionProducts(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-100 shrink-0">
              <input 
                type="text" 
                placeholder="Rechercher un produit..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                  <label key={product.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product.id.toString())}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id.toString()]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id.toString()));
                        }
                      }}
                      className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden shrink-0">
                        {product.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-gray-800 truncate">{product.name}</span>
                        <span className="text-sm text-gray-500">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 shrink-0 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setEditingSectionProducts(null)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  const updated = homeSections.map(s => s.id === editingSectionProducts ? { ...s, productIds: selectedProducts } : s);
                  saveHomeSections(updated);
                  setEditingSectionProducts(null);
                  toast.success('Produits enregistrés !');
                }}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium transition-colors"
              >
                Enregistrer les produits ({selectedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
