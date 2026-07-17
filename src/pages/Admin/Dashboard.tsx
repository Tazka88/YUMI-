import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, TrendingUp, AlertCircle, Package, Plus, Edit, Trash2, X, Image as ImageIcon, Upload, User } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import FooterSettings from './FooterSettings';
import PageSettings from './PageSettings';
import WilayasSettings from './WilayasSettings';
import CommunesSettings from './CommunesSettings';
import OfficesSettings from './OfficesSettings';
import { FileText, MapPin, Search, LayoutGrid, List, Printer, Download, Truck, Building2, Mail, Navigation, ChevronDown, ChevronRight, LayoutTemplate } from 'lucide-react';
import OrderKanban from './OrderKanban';
import SliderImagesAdmin from './SliderImagesAdmin';
import BlogAdmin from './BlogAdmin';

export interface HomeSection {
  id: string;
  type: 'flash_sales' | 'best_sellers' | 'popular' | 'new' | 'custom' | 'category' | 'brand';
  title: string;
  emoji?: string;
  isVisible: boolean;
  productIds?: string[];
  categoryId?: number | string;
  brandId?: number | string;
  isCarouselOnMobile?: boolean;
}

const defaultSections: HomeSection[] = [
  { id: 'flash_sales', type: 'flash_sales', title: 'Ventes Flash', isVisible: true },
  { id: 'best_sellers', type: 'best_sellers', title: 'Meilleures Ventes 🏆', isVisible: true },
  { id: 'popular', type: 'popular', title: 'Produits Populaires 🔥', isVisible: true },
  { id: 'new', type: 'new', title: 'Nouveautés 🆕', isVisible: true },
];

import { Helmet } from 'react-helmet-async';

export function generateSlug(text: string) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Global cache to prevent re-fetching and save Egress
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [productSubTab, setProductSubTab] = useState('products');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [stats, setStats] = useState({ orders: 0, revenue: 0, lowStock: 0 });
  const [refreshToggle, setRefreshToggle] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [deliveryCompany, setDeliveryCompany] = useState<'dhd' | 'ecomdz'>('dhd');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderView, setOrderView] = useState<'list' | 'kanban'>('kanban');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // SWR Fetcher
  const swrFetcher = async (url: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No token');
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('API Error');
    return res.json();
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
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
    name: '', slug: '', sku: '', category_id: '', subcategory_id: '', sub_subcategory_id: '', brand_id: '', brand_name: '', price: '', promo_price: '', stock: '', weight: '', description: '', image: '', video_url: '',
    is_popular: false, is_best_seller: false, is_new: false, is_recommended: false, is_fast_delivery: false, is_active: true, images: [] as any[], variations: [] as any[],
    features: '', key_points: '', faq_q1: '', faq_a1: '', faq_q2: '', faq_a2: '', seo_title: '', seo_description: '', seo_keywords: '', main_image_alt: ''
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
    name: '', slug: '', image: '', description: '', seo_title: '', seo_description: '', h1_title: '', seo_content: ''
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
  const [newSectionType, setNewSectionType] = useState<'custom' | 'category' | 'brand'>('custom');
  const [newSectionTargetId, setNewSectionTargetId] = useState('');
  const [newSectionIsCarousel, setNewSectionIsCarousel] = useState(true);
  const [editingSectionProducts, setEditingSectionProducts] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [debouncedAdminProductSearch, setDebouncedAdminProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [debouncedOrderSearchTerm, setDebouncedOrderSearchTerm] = useState('');
  const [modalFilters, setModalFilters] = useState({ category_id: '', brand_id: '', max_price: '' });
  const [modalProducts, setModalProducts] = useState<any[]>([]);
  const [loadingModalProducts, setLoadingModalProducts] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    if (!editingSectionProducts) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoadingModalProducts(true);
    const searchParams = new URLSearchParams();
    searchParams.append('limit', '50');
    if (debouncedProductSearch) searchParams.append('search', debouncedProductSearch);
    if (modalFilters.category_id) searchParams.append('category_id', modalFilters.category_id);
    if (modalFilters.brand_id) searchParams.append('brand_id', modalFilters.brand_id);
    if (modalFilters.max_price) searchParams.append('max_price', modalFilters.max_price);

    fetch(`/api/admin/products?${searchParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products)) {
          setModalProducts(data.products);
        } else if (Array.isArray(data)) {
          setModalProducts(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingModalProducts(false));
  }, [editingSectionProducts, debouncedProductSearch, modalFilters]);

  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [emailSourceFilter, setEmailSourceFilter] = useState('all');
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAdminProductSearch(adminProductSearch);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [adminProductSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrderSearchTerm(orderSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [orderSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedOrderSearchTerm, orderStatusFilter]);

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
      window.dispatchEvent(new Event('zorando_sections_updated'));
    } catch (err) {
      console.error('Failed to save sections', err);
    }
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    if (newSectionType === 'category' && !newSectionTargetId) return toast.error('Veuillez sélectionner une catégorie');
    if (newSectionType === 'brand' && !newSectionTargetId) return toast.error('Veuillez sélectionner une marque');

    const newSection: HomeSection = {
      id: Date.now().toString(),
      type: newSectionType as any,
      title: newSectionTitle,
      emoji: newSectionEmoji || '✨',
      isVisible: true,
      productIds: [],
      ...(newSectionType === 'category' ? { categoryId: newSectionTargetId } : {}),
      ...(newSectionType === 'brand' ? { brandId: newSectionTargetId } : {}),
      isCarouselOnMobile: newSectionIsCarousel
    };
    saveHomeSections([...homeSections, newSection]);
    setNewSectionTitle('');
    setNewSectionEmoji('✨');
    setNewSectionTargetId('');
    setNewSectionIsCarousel(true);
  };

  const handleToggleSection = (id: string) => {
    const updated = homeSections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s);
    saveHomeSections(updated);
  };

  const handleToggleCarousel = (id: string) => {
    const updated = homeSections.map(s => s.id === id ? { ...s, isCarouselOnMobile: !s.isCarouselOnMobile } : s);
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

  const spProducts = new URLSearchParams();
  if (debouncedAdminProductSearch) spProducts.append('search', debouncedAdminProductSearch);
  spProducts.append('page', currentPage.toString());
  spProducts.append('limit', itemsPerPage.toString());

  const spOthers = new URLSearchParams();
  spOthers.append('page', currentPage.toString());
  spOthers.append('limit', itemsPerPage.toString());

  const spOrders = new URLSearchParams();
  if (debouncedOrderSearchTerm) spOrders.append('search', debouncedOrderSearchTerm);
  if (orderStatusFilter !== 'all') spOrders.append('status', orderStatusFilter);
  spOrders.append('page', currentPage.toString());
  spOrders.append('limit', itemsPerPage.toString());

  const { data: swrStats, error: statsError } = useSWR(activeTab === 'overview' ? `/api/admin/stats?_rt=${refreshToggle}` : null, swrFetcher);
  const { data: swrOrders } = useSWR(activeTab === 'orders' ? `/api/admin/orders?${spOrders.toString()}&_rt=${refreshToggle}` : null, swrFetcher);
  const { data: swrProducts } = useSWR(activeTab === 'products' ? `/api/admin/products?${spProducts.toString()}&_rt=${refreshToggle}` : null, swrFetcher);
  const { data: swrEmails } = useSWR(activeTab === 'emails' ? `/api/admin/emails?${spOthers.toString()}&_rt=${refreshToggle}` : null, swrFetcher);
  const { data: swrEmailLogs } = useSWR(activeTab === 'email-logs' ? `/api/admin/email-logs?${spOthers.toString()}&_rt=${refreshToggle}` : null, swrFetcher);
  const { data: swrCategories } = useSWR(['products', 'categories', 'sections'].includes(activeTab) ? `/api/categories?_rt=${refreshToggle}` : null, swrFetcher);
  const { data: swrBrands } = useSWR(['products', 'brands', 'sections'].includes(activeTab) ? `/api/brands?_rt=${refreshToggle}` : null, swrFetcher);
  const { data: swrSettings } = useSWR(['settings', 'account'].includes(activeTab) ? `/api/admin/settings?_rt=${refreshToggle}` : null, swrFetcher);

  useEffect(() => {
    if (statsError) navigate('/admin-7xK9pL2q/login');
  }, [statsError, navigate]);

  useEffect(() => {
    if (swrStats && typeof swrStats === 'object') setStats(swrStats);
  }, [swrStats]);

  useEffect(() => {
    if (swrOrders) {
      if (swrOrders.orders) { setOrders(swrOrders.orders); setTotalPages(Math.ceil((swrOrders.totalCount || 1) / itemsPerPage)); }
      else if (Array.isArray(swrOrders)) { setOrders(swrOrders); setTotalPages(Math.ceil(swrOrders.length / itemsPerPage)); }
    }
  }, [swrOrders, itemsPerPage]);

  useEffect(() => {
    if (swrProducts) {
      if (swrProducts.products) { setProducts(swrProducts.products); setTotalPages(Math.ceil((swrProducts.totalCount || 1) / itemsPerPage)); }
      else if (Array.isArray(swrProducts)) { setProducts(swrProducts); setTotalPages(Math.ceil(swrProducts.length / itemsPerPage)); }
    }
  }, [swrProducts, itemsPerPage]);

  useEffect(() => {
    if (swrEmails) {
      if (swrEmails.emails) { setEmails(swrEmails.emails); setTotalPages(Math.ceil((swrEmails.totalCount || 1) / itemsPerPage)); }
      else if (Array.isArray(swrEmails)) { setEmails(swrEmails); setTotalPages(Math.ceil(swrEmails.length / itemsPerPage)); }
    }
  }, [swrEmails, itemsPerPage]);

  useEffect(() => {
    if (swrEmailLogs) {
      if (swrEmailLogs.logs) { setEmailLogs(swrEmailLogs.logs); setTotalPages(Math.ceil((swrEmailLogs.totalCount || 1) / itemsPerPage)); }
      else if (Array.isArray(swrEmailLogs)) { setEmailLogs(swrEmailLogs); setTotalPages(Math.ceil(swrEmailLogs.length / itemsPerPage)); }
    }
  }, [swrEmailLogs, itemsPerPage]);

  useEffect(() => {
    if (swrCategories && Array.isArray(swrCategories)) setCategories(swrCategories);
  }, [swrCategories]);

  useEffect(() => {
    if (swrBrands && Array.isArray(swrBrands)) setBrands(swrBrands);
  }, [swrBrands]);

  useEffect(() => {
    if (swrSettings && typeof swrSettings === 'object' && !swrSettings.error) {
      setSettingsForm(prev => ({ ...prev, ...swrSettings }));
    }
  }, [swrSettings]);

  const toSlug = (text: string) => {
    if (!text) return '';
    return text.toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, customName?: string) => {
    const file = e.target.files?.[0];
    if (!file) return null;

    const toastId = toast.loading('Téléchargement de l\'image...');
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (customName) formData.append('customName', customName);

      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      e.target.value = ''; // Reset input

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
    navigate('/admin-7xK9pL2q/login');
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

  const updateOrderItemStatus = async (orderId: number, itemId: number, status: string) => {
    const token = localStorage.getItem('adminToken');
    const toastId = toast.loading('Mise à jour...');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/items/${itemId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success('Statut mis à jour', { id: toastId });
        
        // Refresh orders to get updated total_amount
        fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` }, signal: new AbortController().signal })
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setOrders(data); })
          .catch(console.error);
      } else {
        toast.error('Erreur lors de la mise à jour', { id: toastId });
      }
    } catch (err) {
      toast.error('Erreur de connexion', { id: toastId });
    }
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

      const itemsHtml = orderData.items.filter((item: any) => item.status !== 'cancelled').map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.product_name}
            ${item.variation ? `<br><small style="color: #666;">${item.variation}</small>` : ''}
          </td>
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
              <div class="logo">ZORANDO Store</div>
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
            ${orderData.commune ? `<div><strong>Commune:</strong> ${orderData.commune}</div>` : ''}
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

  const ALGERIA_WILAYAS: Record<string, number> = {
    "adrar": 1, "chlef": 2, "laghouat": 3, "oum el bouaghi": 4, "batna": 5, "béjaïa": 6, "biskra": 7, "béchar": 8, "blida": 9,
    "bouira": 10, "tamanrasset": 11, "tébessa": 12, "tlemcen": 13, "tiaret": 14, "tizi ouzou": 15, "alger": 16, "djelfa": 17,
    "jijel": 18, "sétif": 19, "saïda": 20, "skikda": 21, "sidi bel abbès": 22, "annaba": 23, "guelma": 24, "constantine": 25,
    "médéa": 26, "mostaganem": 27, "m'sila": 28, "mascara": 29, "ouargla": 30, "oran": 31, "el bayadh": 32, "illizi": 33,
    "bordj bou arreridj": 34, "boumerdès": 35, "el tarf": 36, "tindouf": 37, "tissemsilt": 38, "el oued": 39, "khenchela": 40,
    "souk ahras": 41, "tipaza": 42, "mila": 43, "aïn defla": 44, "naâma": 45, "aïn témouchent": 46, "ghardaïa": 47,
    "relizane": 48, "timimoun": 49, "bordj badji mokhtar": 50, "ouled djellal": 51, "béni abbès": 52, "in salah": 53,
    "in guezzam": 54, "touggourt": 55, "djanet": 56, "el m'ghair": 57, "el meniaa": 58
  };

  const getDhdWilayaId = (wilayaName: string): number => {
    if (!wilayaName) return 16;
    const str = wilayaName.toString().toLowerCase().trim();
    const match = str.match(/^\d+/);
    if (match) return parseInt(match[0]);
    for (const [name, id] of Object.entries(ALGERIA_WILAYAS)) {
      if (str.includes(name) || str === name) return id;
    }
    return 16; // default
  };

  const sendToDhd = async (id: number, silent = false) => {
    const token = localStorage.getItem('adminToken');
    let loadId;
    if (!silent) loadId = toast.loading('Envoi vers DHD Livraison...');
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orderData = await res.json();
      
      if (!res.ok) throw new Error(orderData.error);
      
      const wilayaId = getDhdWilayaId(orderData.wilaya);
      const activeItems = orderData.items?.filter((i: any) => i.status !== 'cancelled') || [];
      const productsNames = activeItems.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ') || 'Produit';

      const cleanPhone = (orderData.customer_phone || '').replace(/\D/g, '');

      const payload: any = {
        reference: orderData.order_id || `#${orderData.id}`,
        nom_client: orderData.customer_name || 'Client',
        telephone: cleanPhone || '0000000000',
        adresse: orderData.address || 'Aucune adresse',
        code_wilaya: wilayaId,
        wilaya: wilayaId,
        commune: orderData.commune || 'Centre',
        montant: orderData.total_amount,
        remarque: orderData.note || '',
        produit: productsNames.substring(0, 250),
        type: 1, // Livraison
        stop_desk: orderData.stop_desk ? 1 : 0
      };

      if (orderData.office_id) {
        payload.office_id = orderData.office_id;
      }

      const deliveryRes = await fetch('/api/delivery/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const deliveryData = await deliveryRes.json();
      
      if (!deliveryRes.ok) {
        let detailMsg = '';
        if (deliveryData.details) {
          if (Array.isArray(deliveryData.details)) {
            detailMsg = deliveryData.details.map((d: any) => d.message).join(', ');
          } else if (deliveryData.details.message) {
            detailMsg = deliveryData.details.message;
            if (deliveryData.details.errors) {
              const errorsList = Object.values(deliveryData.details.errors).flat();
              if (errorsList.length > 0) {
                 detailMsg += ' : ' + errorsList.join(' | ');
              }
            }
          }
        }
        throw new Error(detailMsg || deliveryData.error || 'Erreur API Livraison');
      }

      if (!silent) toast.success('Commande envoyée avec succès', { id: loadId });
      
      await updateOrderStatus(id, 'expédiée');
      return true;
    } catch (err: any) {
      console.error(err);
      if (!silent) toast.error(err.message, { id: loadId });
      return false;
    }
  };

  
  const sendToEcomDz = async (id: number, silent = false) => {
    const token = localStorage.getItem('adminToken');
    let loadId;
    if (!silent) loadId = toast.loading('Envoi vers Ecom-DZ...');
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orderData = await res.json();
      
      if (!res.ok) throw new Error(orderData.error);
      
      const wilayaId = getDhdWilayaId(orderData.wilaya);

      const activeItems = orderData.items?.filter((i: any) => i.status !== 'cancelled') || [];
      const productsNames = activeItems.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ') || 'Produit';

      const cleanPhone = (orderData.customer_phone || '').replace(/\D/g, '');

      // Check commune format
      const communeRes = await fetch(`/api/ecomdz/communes/${wilayaId}`);
      if (!communeRes.ok) throw new Error("Erreur de récupération des communes Ecom-DZ");
      const communeData = await communeRes.json();
      
      let matchedCommune = communeData.Commune?.[0]?.Commune || 'Alger Centre';
      if (orderData.commune) {
        const found = communeData.Commune?.find((c: any) => c.Commune.toLowerCase() === orderData.commune.toLowerCase());
        if (found) {
          matchedCommune = found.Commune;
        } else {
          const fuzzy = communeData.Commune?.find((c: any) => c.Commune.toLowerCase().includes(orderData.commune.toLowerCase()) || orderData.commune.toLowerCase().includes(c.Commune.toLowerCase()));
          if (fuzzy) matchedCommune = fuzzy.Commune;
        }
      }

let codeStopdesk = undefined;
      if (orderData.stop_desk) {
        if (orderData.office_id && isNaN(Number(orderData.office_id))) {
          // If it's a string like '16A', use it directly
          codeStopdesk = orderData.office_id;
        } else {
          // Fallback if we only have the name
          const stopdeskRes = await fetch(`/api/ecomdz/stopdesk/${wilayaId}`);
          const stopdeskData = await stopdeskRes.json();
          
          let matchedStopdesk = null;
          if (orderData.office_name) {
            matchedStopdesk = stopdeskData.Commune?.find((s: any) => s.Libelle.toLowerCase().includes(orderData.office_name.toLowerCase()) || orderData.office_name.toLowerCase().includes(s.Libelle.toLowerCase()));
          }
          
          if (!matchedStopdesk && matchedCommune) {
             matchedStopdesk = stopdeskData.Commune?.find((s: any) => s.Commune.toLowerCase() === matchedCommune.toLowerCase());
          }
          
          if (matchedStopdesk) {
            codeStopdesk = matchedStopdesk.Code;
          } else if (stopdeskData.Commune && stopdeskData.Commune.length > 0) {
            codeStopdesk = stopdeskData.Commune[0].Code;
          } else {
            throw new Error(`Aucun bureau Stopdesk trouvé pour la wilaya ${wilayaId}`);
          }
        }
      }

      const payload = {
        Colis: [{
          Echange: 0,
          Stopdesk: orderData.stop_desk ? 1 : 0,
          CodeStopdesk: codeStopdesk,
          NomComplet: orderData.customer_name || 'Client',
          Mobile_1: cleanPhone || '0000000000',
          Adresse: orderData.address || 'Aucune adresse',
          Wilaya: wilayaId,
          Commune: matchedCommune,
          Article: productsNames.substring(0, 150),
          Total: orderData.total_amount,
          NoteFournisseur: orderData.note || '',
          ID_Externe: orderData.order_id || `#${orderData.id}`,
        }]
      };

      const deliveryRes = await fetch('/api/ecomdz/create-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const deliveryData = await deliveryRes.json();
      
      if (!deliveryRes.ok) {
        throw new Error(deliveryData.error || 'Erreur lors de l\'envoi à Ecom-DZ');
      }

      if (deliveryData.Colis && deliveryData.Colis.length > 0) {
        const firstColis = deliveryData.Colis[0];
        if (firstColis.Erreur === 1 || firstColis.Erreur === true || !firstColis.Tracking) {
           throw new Error(firstColis.Message || 'Erreur de validation Ecom-DZ');
        }
      }

      const updateRes = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'shipped' })
      });
      
      if (!updateRes.ok) throw new Error('Commande envoyée, mais statut non mis à jour');

      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'shipped' } : o));
      
      if (!silent) {
        toast.success('Commande envoyée à Ecom-DZ avec succès', { id: loadId });
      }
      return true;
    } catch (err: any) {
      if (!silent) toast.error(err.message, { id: loadId });
      return false;
    }
  };

const handleBulkDelivery = async () => {
    if (selectedOrders.length === 0) return;
    const loadId = toast.loading(`Envoi de ${selectedOrders.length} commandes...`);
    let successCount = 0;
    
    for (const id of selectedOrders) {
      const order = orders.find(o => o.id === id);
      const company = order?.delivery_company || deliveryCompany;
      const success = company === 'ecomdz' ? await sendToEcomDz(id, true) : await sendToDhd(id, true);
      if (success) successCount++;
    }
    
    toast.success(`${successCount}/${selectedOrders.length} envoyée(s)`, { id: loadId });
    setSelectedOrders([]);
  };
  const handleBulkDhd = async () => {
    if (selectedOrders.length === 0) return;
    const loadId = toast.loading(`Envoi de ${selectedOrders.length} commandes...`);
    let successCount = 0;
    
    for (const id of selectedOrders) {
      const success = await sendToDhd(id, true);
      if (success) successCount++;
    }
    
    toast.success(`${successCount}/${selectedOrders.length} envoyée(s) à DHD`, { id: loadId });
    setSelectedOrders([]);
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
        const itemsHtml = orderData.items.filter((item: any) => item.status !== 'cancelled').map((item: any) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
              ${item.product_name}
              ${item.variation ? `<br><small style="color: #666;">${item.variation}</small>` : ''}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price} DA</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price * item.quantity} DA</td>
          </tr>
        `).join('');

        return `
          <div class="page-break">
            <div class="header">
              <div>
                <div class="logo">ZORANDO Store</div>
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
            <button onclick="window.print()" style="background: #FF6A00; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">Imprimer toutes les commandes</button>
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

  const openModal = async (product: any = null) => {
    if (product) {
      const toastId = toast.loading('Chargement des détails...');
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`/api/admin/products/${product.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erreur');
        const fullProduct = await res.json();
        
        toast.dismiss(toastId);
        setEditingProduct(fullProduct);
        
        let parsedVariations = [];
        if (typeof fullProduct.variations === 'string') {
          try { parsedVariations = JSON.parse(fullProduct.variations); } catch(e) {}
        } else if (Array.isArray(fullProduct.variations)) {
          parsedVariations = fullProduct.variations;
        }

        let parsedFeatures = fullProduct.features;
        if (typeof parsedFeatures === 'string') {
          try { parsedFeatures = JSON.parse(parsedFeatures); } catch(e) {}
        }
        let parsedKeyPoints = fullProduct.key_points;
        if (typeof parsedKeyPoints === 'string') {
          try { parsedKeyPoints = JSON.parse(parsedKeyPoints); } catch(e) {}
        }
        
        setProductForm({
          name: fullProduct.name, slug: fullProduct.slug, sku: fullProduct.sku || '', category_id: fullProduct.category_id, subcategory_id: fullProduct.subcategory_id || '', sub_subcategory_id: fullProduct.sub_subcategory_id || '', brand_id: fullProduct.brand_id || '', brand_name: fullProduct.brand_name || '',
          price: fullProduct.price, 
          promo_price: (fullProduct.promo_price !== null && fullProduct.promo_price !== undefined) ? fullProduct.promo_price : '', 
          stock: fullProduct.stock, 
          weight: (fullProduct.weight !== null && fullProduct.weight !== undefined) ? fullProduct.weight : '',
          description: fullProduct.description || '', image: fullProduct.image || '', video_url: fullProduct.video_url || '',
          is_popular: !!fullProduct.is_popular, is_best_seller: !!fullProduct.is_best_seller, 
          is_new: !!fullProduct.is_new, is_recommended: !!fullProduct.is_recommended,
          is_fast_delivery: !!fullProduct.is_fast_delivery,
          is_active: fullProduct.is_active !== false,
          images: fullProduct.images || [],
          variations: parsedVariations,
          features: typeof parsedFeatures === 'string' ? parsedFeatures : (Array.isArray(parsedFeatures) ? parsedFeatures.map((f: any) => `${f.key}: ${f.value}`).join('\n') : ''),
          key_points: typeof parsedKeyPoints === 'string' ? parsedKeyPoints : (Array.isArray(parsedKeyPoints) ? parsedKeyPoints.join('\n') : ''),
          faq_q1: fullProduct.faq_q1 || '', faq_a1: fullProduct.faq_a1 || '', faq_q2: fullProduct.faq_q2 || '', faq_a2: fullProduct.faq_a2 || '',
          seo_title: fullProduct.seo_title || '', seo_description: fullProduct.seo_description || '', seo_keywords: fullProduct.seo_keywords || '', main_image_alt: fullProduct.main_image_alt || ''
        });
      } catch (e) {
        toast.dismiss(toastId);
        toast.error('Erreur lors du chargement');
        return;
      }
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', slug: '', sku: '', category_id: categories[0]?.id || '', subcategory_id: '', sub_subcategory_id: '', brand_id: '', brand_name: '', price: '', promo_price: '', stock: '', weight: '', description: '', image: '', video_url: '',
        is_popular: false, is_best_seller: false, is_new: false, is_recommended: false, is_fast_delivery: false, is_active: true, images: [], variations: [], features: '', key_points: '',
        faq_q1: '', faq_a1: '', faq_q2: '', faq_a2: '', seo_title: '', seo_description: '', seo_keywords: '', main_image_alt: ''
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
        name: brand.name, slug: brand.slug, image: brand.image || '', description: brand.description || '',
        seo_title: brand.seo_title || '',
        seo_description: brand.seo_description || '',
        h1_title: brand.h1_title || '',
        seo_content: brand.seo_content || ''
      });
    } else {
      setEditingBrand(null);
      setBrandForm({
        name: '', slug: '', image: '', description: '', seo_title: '', seo_description: '', h1_title: '', seo_content: ''
      });
    }
    setIsBrandModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.name) {
      toast.error('Le nom du produit est requis');
      return;
    }
    if (!productForm.slug) {
      toast.error('Le slug est requis');
      return;
    }
    if (!productForm.price) {
      toast.error('Le prix est requis');
      return;
    }
    if (!productForm.seo_title) {
      toast.error('Le Titre SEO est requis');
      return;
    }
    if (!productForm.seo_description) {
      toast.error('La Meta Description est requise');
      return;
    }

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
      price: parseFloat(productForm.price.toString().replace(',', '.')),
      promo_price: (productForm.promo_price !== '' && productForm.promo_price !== null) ? parseFloat(productForm.promo_price.toString().replace(',', '.')) : null,
      stock: parseInt(productForm.stock as string, 10),
      weight: (productForm.weight !== '' && productForm.weight !== null) ? parseFloat(productForm.weight.toString().replace(',', '.')) : null,
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

      toast.success(editingProduct ? 'Produit modifié avec succès' : 'Produit créé avec succès');
      setIsModalOpen(false);
      setRefreshToggle(prev => prev + 1);
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
          setRefreshToggle(prev => prev + 1);
          setConfirmModal({ ...confirmModal, isOpen: false });
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subcategoryForm.name) {
      toast.error('Le nom est requis');
      return;
    }
    if (!subcategoryForm.slug) {
      toast.error('Le slug est requis');
      return;
    }
    if (!subcategoryForm.category_id) {
      toast.error('Veuillez sélectionner une catégorie parente');
      return;
    }

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

      toast.success(editingSubcategory ? 'Sous-catégorie modifiée avec succès' : 'Sous-catégorie créée avec succès');
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
    
    if (!subSubcategoryForm.name) {
      toast.error('Le nom est requis');
      return;
    }
    if (!subSubcategoryForm.slug) {
      toast.error('Le slug est requis');
      return;
    }
    if (!subSubcategoryForm.subcategory_id) {
      toast.error('Veuillez sélectionner une sous-catégorie parente');
      return;
    }

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

      toast.success(editingSubSubcategory ? 'Sous-sous-catégorie modifiée avec succès' : 'Sous-sous-catégorie créée avec succès');
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
    
    if (!categoryForm.name) {
      toast.error('Le nom est requis');
      return;
    }
    if (!categoryForm.slug) {
      toast.error('Le slug est requis');
      return;
    }

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

      toast.success(editingCategory ? 'Catégorie modifiée avec succès' : 'Catégorie créée avec succès');
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
    
    if (!brandForm.name) {
      toast.error('Le nom est requis');
      return;
    }
    if (!brandForm.slug) {
      toast.error('Le slug est requis');
      return;
    }

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

      toast.success(editingBrand ? 'Marque modifiée avec succès' : 'Marque créée avec succès');
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
        body: JSON.stringify({ 
          admin_email: settingsForm.admin_email,
          resend_api_key: settingsForm.resend_api_key,
          resend_from_email: settingsForm.resend_from_email
        })
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

  const handleExportMetaCatalog = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/export-meta-catalog', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const exportedCount = response.headers.get('X-Exported-Count') || '0';
      const ignoredCount = response.headers.get('X-Ignored-Count') || '0';
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meta-catalog.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`${exportedCount} produits exportés. ${ignoredCount} produits ignorés car image manquante.`, { duration: 5000 });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export du catalogue');
    }
  };

  const exportEmailsToCSV = () => {
    const filteredEmails = emails.filter(e => {
        const matchesSearch = (e.email?.toLowerCase().includes(emailSearchTerm.toLowerCase()) || 
                              e.name?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                              e.phone?.toLowerCase().includes(emailSearchTerm.toLowerCase()));
        const matchesSource = emailSourceFilter === 'all' || e.source === emailSourceFilter;
        return matchesSearch && matchesSource;
    });

    const headers = ['Email', 'Nom', 'Telephone', 'Source', 'Date'];
    const csvRows = [
      headers.join(','),
      ...filteredEmails.map(e => [
        `"${e.email || ''}"`,
        `"${e.name || ''}"`,
        `"${e.phone || ''}"`,
        `"${e.source || ''}"`,
        `"${new Date(e.created_at).toLocaleDateString()}"`
      ].join(','))
    ];

    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `emails_zorando_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          {settingsForm.site_logo ? (
            <img src={settingsForm.site_logo} alt="ZORANDO Logo" className="h-8 w-auto object-contain" />
          ) : (
            <>
              <div className="bg-orange-500 text-white px-2 py-1 rounded-md font-black italic text-xl">Z</div>
              <span className="text-xl font-bold tracking-tight">ZORANDO Admin</span>
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
            onClick={() => setActiveTab('blog')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'blog' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <FileText size={20} />
            Blog & Actualités
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
            onClick={() => setActiveTab('communes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'communes' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Navigation size={20} />
            Communes
          </button>
          <button 
            onClick={() => setActiveTab('offices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'offices' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Building2 size={20} />
            Points Relais (Bureaux)
          </button>
          <button 
            onClick={() => setActiveTab('emails')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'emails' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Mail size={20} />
            Liste des Emails
          </button>
          <button 
            onClick={() => setActiveTab('email-logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'email-logs' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <FileText size={20} />
            Logs Emails
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
                  onSendToDhd={(id) => { const o = orders.find(x => x.id === id); const c = o?.delivery_company || deliveryCompany; return c === 'ecomdz' ? sendToEcomDz(id) : sendToDhd(id); }}
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
                        <div className="flex items-center gap-2">
                          <select 
                            value={deliveryCompany} 
                            onChange={(e) => setDeliveryCompany(e.target.value as 'dhd' | 'ecomdz')}
                            className="text-sm border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 h-[34px] py-1 px-2 bg-white"
                          >
                            <option value="dhd">DHD</option>
                            <option value="ecomdz">Ecom-DZ</option>
                          </select>
                          <button
                            onClick={handleBulkDelivery}
                            className="text-sm bg-orange-500 border border-transparent text-white px-3 py-1.5 rounded hover:bg-orange-600 transition-colors flex items-center gap-1 h-[34px]"
                          >
                            <Truck size={14} /> Envoyer {selectedOrders.length > 0 ? `(${selectedOrders.length})` : ''}
                          </button>
                        </div>
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
                      <React.Fragment key={order.id}>
                      <tr className={`hover:bg-gray-50 ${selectedOrders.includes(order.id) ? 'bg-orange-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="flex items-center gap-1 hover:text-orange-600">
                            {expandedOrderId === order.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            {order.order_id || `#${order.id}`}
                          </button>
                        </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.address}</div>
                        {order.delivery_company && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${order.delivery_company === 'ecomdz' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {order.delivery_company === 'ecomdz' ? 'ECOM-DZ' : 'DHD'}
                            </span>
                            {order.stop_desk && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">Stopdesk</span>}
                          </div>
                        )}

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
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { const c = order.delivery_company || deliveryCompany; return c === 'ecomdz' ? sendToEcomDz(order.id) : sendToDhd(order.id); }}
                            className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                            title={`Envoyer à ${deliveryCompany.toUpperCase()}`}
                          >
                            <Truck size={16} />
                          </button>
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
                    {expandedOrderId === order.id && order.items && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-inner">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium text-gray-600">Produit</th>
                                  <th className="px-4 py-2 text-center font-medium text-gray-600">Qté</th>
                                  <th className="px-4 py-2 text-right font-medium text-gray-600">P.U</th>
                                  <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
                                  <th className="px-4 py-2 text-right font-medium text-gray-600">Statut</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {order.items.map((item: any) => (
                                  <tr key={item.id} className={item.status === 'cancelled' ? 'opacity-50' : ''}>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 object-cover rounded border border-gray-200" />}
                                        <div>
                                          <div className="font-medium text-gray-900 line-clamp-1" title={item.product_name || 'Produit inconnu'}>
                                            {item.product_name || 'Produit inconnu'}
                                          </div>
                                          {item.variation && <div className="text-xs text-gray-500">{item.variation}</div>}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right">{formatPrice(item.price)}</td>
                                    <td className="px-4 py-3 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                                    <td className="px-4 py-3 text-right flex justify-end">
                                      <select 
                                        value={item.status || 'active'}
                                        onChange={(e) => updateOrderItemStatus(order.id, item.id, e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-medium capitalize cursor-pointer focus:ring-2 focus:ring-orange-500 ${item.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} border border-transparent hover:border-gray-300`}
                                      >
                                        <option value="active">Actif</option>
                                        <option value="cancelled">Annulé</option>
                                      </select>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Pagination for Orders */}
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
              <div className="text-sm text-gray-500">
                Affichage de la page <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Commandes/page:</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="500">500</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-md border ${currentPage === 1 ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors'}`}
                  >
                    Précédent
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 2 + i;
                          if (pageNum + (4 - i) > totalPages) {
                            pageNum = totalPages - 4 + i;
                          }
                        }
                      }
                      if (pageNum > totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-orange-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium rounded-md border ${currentPage === totalPages ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors'}`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
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
              <button 
                onClick={() => setProductSubTab('sub_subcategories')} 
                className={`pb-2 px-2 font-medium text-sm transition-colors ${productSubTab === 'sub_subcategories' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Sous-sous-catégories
              </button>
            </div>

            {productSubTab === 'products' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col gap-1 w-full md:w-auto">
                    <h2 className="text-lg font-bold text-gray-800">Gestion des produits</h2>
                    <div className="flex gap-2 mt-2">
                      <div className="relative flex-1 md:w-96">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Search className="h-4 w-4 text-gray-400" />
                         </div>
                         <input
                           type="text"
                           className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                           placeholder="Rechercher par nom, description ou ID..."
                           value={adminProductSearch}
                           onChange={(e) => setAdminProductSearch(e.target.value)}
                         />
                      </div>
                      <button 
                        onClick={() => setDebouncedAdminProductSearch(adminProductSearch)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors border border-gray-300"
                      >
                        Rechercher
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <button 
                      onClick={handleExportMetaCatalog}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                    >
                      <Download size={18} />
                      Catalogue Meta
                    </button>
                    <button 
                      onClick={() => openModal()}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
                    >
                      <Plus size={18} />
                      Ajouter un produit
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                      <tr>
                        <th className="px-6 py-3">Image</th>
                        <th className="px-6 py-3">Nom du produit</th>
                        <th className="px-6 py-3">Statut</th>
                        <th className="px-6 py-3">Catégorie</th>
                        <th className="px-6 py-3">Sous-catégorie</th>
                        <th className="px-6 py-3">Sous-sous-catégorie</th>
                        <th className="px-6 py-3">Marque</th>
                        <th className="px-6 py-3">Poids (kg)</th>
                        <th className="px-6 py-3">Prix</th>
                        <th className="px-6 py-3">Stock</th>
                        <th className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <Package size={48} className="text-gray-200" />
                              <p className="text-lg">Aucun produit trouvé</p>
                              {adminProductSearch && <p className="text-sm">Essayez de modifier votre recherche pour "{adminProductSearch}"</p>}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        products.map(product => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <img src={product.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=random&size=50`} alt={product.name} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                            <td className="px-6 py-4">
                              {product.is_active !== false ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Actif</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">Inactif</span>
                              )}
                            </td>
                            <td className="px-6 py-4">{product.category_name}</td>
                            <td className="px-6 py-4 text-gray-500">{product.subcategory_name || '-'}</td>
                            <td className="px-6 py-4 text-gray-500">{product.sub_subcategory_name || '-'}</td>
                            <td className="px-6 py-4 text-gray-500">{product.brand_name || '-'}</td>
                            <td className="px-6 py-4 text-gray-500">{product.weight ? `${product.weight} kg` : '-'}</td>
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                  <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                    <div className="text-sm text-gray-500">
                      Affichage de la page <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{Math.max(1, totalPages)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Produits/page:</span>
                        <select 
                          value={itemsPerPage} 
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="20">20</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                          <option value="500">500</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage <= 1}
                          className={`px-4 py-2 text-sm font-medium rounded-md border ${currentPage <= 1 ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors'}`}
                        >
                          Précédent
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, Math.max(1, totalPages)) }, (_, i) => {
                            // Show pages around current page
                            let pageNum = i + 1;
                            const tPages = Math.max(1, totalPages);
                            if (tPages > 5) {
                              if (currentPage > 3) {
                                pageNum = currentPage - 2 + i;
                                if (pageNum + (4 - i) > tPages) {
                                  pageNum = tPages - 4 + i;
                                }
                              }
                            }
                            
                            if (pageNum > tPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-orange-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage >= totalPages}
                          className={`px-4 py-2 text-sm font-medium rounded-md border ${currentPage >= totalPages ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors'}`}
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
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
        {activeTab === 'communes' && <CommunesSettings />}
        {activeTab === 'offices' && <OfficesSettings />}

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
                                  setSettingsForm(prev => ({...prev, site_logo: reader.result as string}));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {settingsForm.site_logo && (
                          <button 
                            type="button"
                            onClick={() => setSettingsForm(prev => ({...prev, site_logo: ''}))}
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
                      onChange={e => setSettingsForm(prev => ({...prev, active_theme: e.target.value}))}
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
                              setSettingsForm(prev => ({...prev, overlay_intensity: val}));
                              
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
                                if (url) setSettingsForm(prev => ({...prev, [`theme_image_${prev.active_theme}`]: url}));
                              }} 
                            />
                          </label>
                          {settingsForm[`theme_image_${settingsForm.active_theme}`] && (
                            <button 
                              type="button"
                              onClick={() => setSettingsForm(prev => ({...prev, [`theme_image_${prev.active_theme}`]: ''}))}
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
                      onChange={e => setSettingsForm(prev => ({...prev, announcement_phone: e.target.value}))} 
                      placeholder="+213 555 00 00 00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Texte d'annonce (un message par ligne)</label>
                    <textarea 
                      rows={4}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.announcement_text} 
                      onChange={e => setSettingsForm(prev => ({...prev, announcement_text: e.target.value}))} 
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
                          onChange={e => setSettingsForm(prev => ({...prev, announcement_bg_color: e.target.value}))} 
                        />
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                          value={settingsForm.announcement_bg_color || '#000000'} 
                          onChange={e => setSettingsForm(prev => ({...prev, announcement_bg_color: e.target.value}))} 
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
                          onChange={e => setSettingsForm(prev => ({...prev, announcement_text_color: e.target.value}))} 
                        />
                        <input 
                          type="text" 
                          className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                          value={settingsForm.announcement_text_color || '#ffffff'} 
                          onChange={e => setSettingsForm(prev => ({...prev, announcement_text_color: e.target.value}))} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Offre de Réduction (Panier)</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Activer l'offre de livraison</label>
                      <select 
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                        value={settingsForm.show_shipping_discount ?? 'true'}
                        onChange={e => setSettingsForm(prev => ({...prev, show_shipping_discount: e.target.value}))}
                      >
                        <option value="true">Activé</option>
                        <option value="false">Désactivé</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Réduction sur la livraison (%)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                        value={settingsForm.shipping_discount_percent ?? '30'} 
                        onChange={e => setSettingsForm(prev => ({...prev, shipping_discount_percent: e.target.value}))} 
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message d'offre spéciale</label>
                    <textarea 
                      rows={2}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={settingsForm.shipping_discount_message ?? "Profitez de -30% sur les frais de livraison aujourd'hui"} 
                      onChange={e => setSettingsForm(prev => ({...prev, shipping_discount_message: e.target.value}))} 
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">S'affiche dans le panier lors de la saisie de l'email.</p>
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
                      onChange={e => setSettingsForm(prev => ({...prev, whatsapp_number: e.target.value}))} 
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
                      onChange={e => setSettingsForm(prev => ({...prev, ga_measurement_id: e.target.value}))} 
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
                      onChange={e => setSettingsForm(prev => ({...prev, fb_pixel_id: e.target.value}))} 
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
                      onChange={e => setSettingsForm(prev => ({...prev, admin_email: e.target.value}))} 
                      placeholder="nom@exemple.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">Cet email sera utilisé pour recevoir les notifications et messages de contact.</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-50">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Configuration Emails Automatiques (Resend)</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Clé API Resend (RESEND_API_KEY)</label>
                        <input 
                          type="password" 
                          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                          value={settingsForm.resend_api_key || ''} 
                          onChange={e => setSettingsForm(prev => ({...prev, resend_api_key: e.target.value}))} 
                          placeholder="re_..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Obtenez votre clé sur <a href="https://resend.com/api-keys" target="_blank" className="text-orange-500 hover:underline">resend.com</a>. Elle est nécessaire pour les emails de confirmation et de suivi.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email d'expédition (From Email)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                          value={settingsForm.resend_from_email || ''} 
                          onChange={e => setSettingsForm(prev => ({...prev, resend_from_email: e.target.value}))} 
                          placeholder="ZORANDO <onboarding@resend.dev>"
                        />
                        <p className="text-xs text-gray-500 mt-1">L'expéditeur affiché aux clients. Utilisez "onboarding@resend.dev" uniquement pour des tests sur votre propre email. <span className="font-bold text-orange-600">IMPORTANT : Si vous voyez une "Erreur 422", c'est que vous essayez d'envoyer un email à un client sans avoir vérifié votre propre domaine sur Resend.</span></p>
                      </div>
                    </div>
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

        {activeTab === 'blog' && (
          <BlogAdmin />
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
                        {!['custom', 'category', 'brand'].includes(section.type) && (
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
                      {section.type === 'category' && (
                         <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full uppercase tracking-wide font-bold">Catégorie</span>
                      )}
                      {section.type === 'brand' && (
                         <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full uppercase tracking-wide font-bold">Marque</span>
                      )}
                      {['custom', 'category', 'brand'].includes(section.type) && (
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 mr-2">
                          <input 
                            type="checkbox" 
                            checked={section.isCarouselOnMobile ?? true} 
                            onChange={() => handleToggleCarousel(section.id)}
                            className="rounded text-orange-500 focus:ring-orange-500"
                          />
                          Carrousel Mobile
                        </label>
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
                        title={!['custom', 'category', 'brand'].includes(section.type) ? "Vous pouvez seulement masquer les sections par défaut" : "Supprimer"}
                        disabled={!['custom', 'category', 'brand'].includes(section.type)}
                        style={{ opacity: !['custom', 'category', 'brand'].includes(section.type) ? 0.3 : 1 }}
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
                
                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/3">
                      <select
                        value={newSectionType}
                        onChange={e => {
                          setNewSectionType(e.target.value as any);
                          setNewSectionTargetId('');
                        }}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="custom">Produits Personnalisés</option>
                        <option value="category">Catégorie</option>
                        <option value="brand">Marque</option>
                      </select>
                    </div>

                    {(newSectionType === 'category') && (
                      <div className="w-full sm:w-2/3">
                        <select
                          value={newSectionTargetId}
                          onChange={e => setNewSectionTargetId(e.target.value)}
                          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Sélectionner une catégorie...</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(newSectionType === 'brand') && (
                      <div className="w-full sm:w-2/3">
                        <select
                          value={newSectionTargetId}
                          onChange={e => setNewSectionTargetId(e.target.value)}
                          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Sélectionner une marque...</option>
                          {brands.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 w-full">
                    <input 
                      type="text" 
                      placeholder="Titre de la section"
                      value={newSectionTitle}
                      onChange={e => setNewSectionTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <input 
                      type="text" 
                      placeholder="Emoji"
                      value={newSectionEmoji}
                      onChange={e => setNewSectionEmoji(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-center"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={newSectionIsCarousel} 
                      onChange={e => setNewSectionIsCarousel(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    Carrousel sur mobile
                  </label>
                  <button 
                    onClick={handleAddSection}
                    className="w-full sm:w-auto px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium transition-colors whitespace-nowrap"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800">Liste des Emails</h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input 
                    type="text" 
                    placeholder="Rechercher par email, nom..." 
                    value={emailSearchTerm}
                    onChange={(e) => setEmailSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <button 
                  onClick={exportEmailsToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-bold transition-colors shadow-sm"
                >
                  <Download size={18} />
                  <span>Exporter Excel</span>
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-gray-100 flex gap-4 overflow-x-auto hide-scrollbar">
              <button 
                onClick={() => setEmailSourceFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${emailSourceFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Tous ({emails.length})
              </button>
              <button 
                onClick={() => setEmailSourceFilter('Newsletter')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${emailSourceFilter === 'Newsletter' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Inscriptions Newsletter
              </button>
              <button 
                onClick={() => setEmailSourceFilter('Commande')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${emailSourceFilter === 'Commande' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Emails Commandes
              </button>
              <button 
                onClick={() => setEmailSourceFilter('Compte Client')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${emailSourceFilter === 'Compte Client' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Comptes Clients
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                  <tr>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Nom</th>
                    <th className="px-6 py-3">Téléphone</th>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Date d'inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emails
                    .filter(e => {
                        const matchesSearch = (e.email?.toLowerCase().includes(emailSearchTerm.toLowerCase()) || 
                                              e.name?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                                              e.phone?.toLowerCase().includes(emailSearchTerm.toLowerCase()));
                        const matchesSource = emailSourceFilter === 'all' || e.source === emailSourceFilter;
                        return matchesSearch && matchesSource;
                    })
                    .map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.email}</td>
                      <td className="px-6 py-4">{item.name || <span className="text-gray-400 italic">Non renseigné</span>}</td>
                      <td className="px-6 py-4">{item.phone || <span className="text-gray-400 italic">Non renseigné</span>}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.source === 'Newsletter' ? 'bg-blue-50 text-blue-600' :
                          item.source === 'Commande' ? 'bg-green-50 text-green-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {item.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">{new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                  {emails.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                           <Mail className="w-12 h-12 text-gray-300" />
                           <p>Aucun email trouvé.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'email-logs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800">Logs des Emails Automatiques</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertCircle size={16} />
                <span>Historique des envois Resend</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-medium">
                  <tr>
                    <th className="px-6 py-3">Commande</th>
                    <th className="px-6 py-3">Destinataire</th>
                    <th className="px-6 py-3">Sujet</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emailLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{log.order_id || 'N/A'}</td>
                      <td className="px-6 py-4">{log.recipient}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{log.subject}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`w-fit px-3 py-1 rounded-full text-xs font-medium ${
                            log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {log.status === 'success' ? 'Émail Envoyé' : 'Échec Envoi'}
                          </span>
                          {log.error_message && (
                            <div className="mt-2 text-[10px] leading-tight font-medium bg-red-50 p-2 rounded border border-red-100 text-red-600 max-w-[250px] whitespace-pre-wrap break-words">
                              {log.error_message}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                  {emailLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Mail className="w-12 h-12 text-gray-200" />
                          <p>Aucun log d'email trouvé.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                    value={productForm.name} 
                    onChange={e => {
                      const name = e.target.value;
                      const slug = generateSlug(name);
                      setProductForm({...productForm, name, slug});
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
                  <input type="text" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.slug} onChange={e => setProductForm({...productForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU / ID Produit Meta</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed" 
                    value={productForm.sku || 'Généré automatiquement'} 
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Code unique pour Meta Ads généré automatiquement.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                  <select className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value, subcategory_id: ''})}>
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
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix Promo (DA)</label>
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.promo_price} onChange={e => setProductForm({...productForm, promo_price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <input type="number" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poids (kg)</label>
                  <input type="number" step="0.01" min="0" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.weight} onChange={e => setProductForm({...productForm, weight: e.target.value})} placeholder="ex: 0.5" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL Vidéo YouTube (Optionnel)</label>
                  <input
                    type="url"
                    value={productForm.video_url}
                    onChange={(e) => setProductForm({...productForm, video_url: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image Principale</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      {productForm.image && (
                        <img src={productForm.image} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                      )}
                      <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
                        <Upload size={18} />
                        Télécharger une image
                        <input type="file" className="hidden" accept="image/*" onClick={(e) => {
                          if (!productForm.name) {
                            e.preventDefault();
                            toast.error('Veuillez saisir le titre du produit avant d\'ajouter une image (pour le renommer automatiquement en SEO).');
                          }
                        }} onChange={async (e) => {
                          const customName = productForm.name ? `${toSlug(productForm.name)}-1` : undefined;
                          const url = await handleFileUpload(e, customName);
                          if (url) setProductForm({...productForm, image: url});
                        }} />
                      </label>
                    </div>
                    {productForm.image && (
                      <input 
                        type="text"
                        placeholder="Texte alternatif (Alt Text) ex: Chaussure Nike Air Max Rouge (Optionnel)"
                        className="w-full text-sm px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                        value={productForm.main_image_alt}
                        onChange={(e) => setProductForm({...productForm, main_image_alt: e.target.value})}
                      />
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images Supplémentaires</label>
                  <div className="flex flex-col gap-4 mb-2">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="relative">
                          <img src={img.url || img.image} alt="Extra" className="w-16 h-16 object-cover rounded border" />
                          <button type="button" onClick={() => {
                            const newImages = [...productForm.images];
                            newImages.splice(idx, 1);
                            setProductForm({...productForm, images: newImages});
                          }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                            <X size={12} />
                          </button>
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text"
                            placeholder="Texte alternatif (Alt Text) ex: Vue de côté (Optionnel)"
                            className="w-full text-sm px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            value={img.alt_text || ''}
                            onChange={(e) => {
                              const newImages = [...productForm.images];
                              newImages[idx].alt_text = e.target.value;
                              setProductForm({...productForm, images: newImages});
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 inline-flex items-center gap-2">
                    <Upload size={18} />
                    Ajouter une image
                    <input type="file" className="hidden" accept="image/*" onClick={(e) => {
                      if (!productForm.name) {
                        e.preventDefault();
                        toast.error('Veuillez saisir le titre du produit avant d\'ajouter des images supplémentaires.');
                      }
                    }} onChange={async (e) => {
                      const customName = productForm.name ? `${toSlug(productForm.name)}-${productForm.images.length + 2}` : undefined;
                      const url = await handleFileUpload(e, customName);
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

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800">Variations de produit (Couleurs, Tailles...)</h4>
                    <button type="button" onClick={() => setProductForm(prev => ({...prev, variations: [...(prev.variations || []), { id: 'v_' + Math.random().toString(36).substr(2, 9), attribute: 'Couleur', value: '', price: '', stock: '', image: '' }]}))} className="text-sm bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200 font-medium">+ Ajouter une variation</button>
                  </div>
                  {(!productForm.variations || productForm.variations.length === 0) && (
                    <p className="text-sm text-gray-500 mb-4">Aucune variation pour ce produit.</p>
                  )}
                  <div className="flex flex-col gap-3 mb-4">
                    {(productForm.variations || []).map((v: any, i: number) => (
                      <div key={v.id || `v_${i}`} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                        <input className="px-2 py-1 border rounded focus:ring-orange-500 focus:border-orange-500" placeholder="Type (ex: Couleur)" value={v.attribute || ''} onChange={e => { setProductForm(prev => { const nv = [...(prev.variations || [])]; nv[i] = { ...nv[i], attribute: e.target.value }; return { ...prev, variations: nv }; }) }} />
                        <input className="px-2 py-1 border rounded focus:ring-orange-500 focus:border-orange-500" placeholder="Valeur (ex: Noir)" value={v.value || ''} onChange={e => { setProductForm(prev => { const nv = [...(prev.variations || [])]; nv[i] = { ...nv[i], value: e.target.value }; return { ...prev, variations: nv }; }) }} />
                        <input type="number" className="px-2 py-1 border rounded focus:ring-orange-500 focus:border-orange-500" placeholder="Prix (+)" value={v.price || ''} onChange={e => { setProductForm(prev => { const nv = [...(prev.variations || [])]; nv[i] = { ...nv[i], price: e.target.value }; return { ...prev, variations: nv }; }) }} />
                        <input type="number" className="px-2 py-1 border rounded focus:ring-orange-500 focus:border-orange-500" placeholder="Stock" value={v.stock || ''} onChange={e => { setProductForm(prev => { const nv = [...(prev.variations || [])]; nv[i] = { ...nv[i], stock: e.target.value }; return { ...prev, variations: nv }; }) }} />
                        <div className="flex gap-2 md:col-span-2 items-center">
                           <input className="px-2 py-1 border rounded flex-1 focus:ring-orange-500 focus:border-orange-500" placeholder="URL Image" value={v.image || ''} onChange={e => { setProductForm(prev => { const nv = [...(prev.variations || [])]; nv[i] = { ...nv[i], image: e.target.value }; return { ...prev, variations: nv }; }) }} />
                           <button type="button" onClick={() => { setProductForm(prev => { const nv = [...(prev.variations || [])]; nv.splice(i,1); return { ...prev, variations: nv }; }) }} className="text-red-500 hover:text-red-700 bg-red-50 p-1 rounded"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-bold text-gray-800 mb-4">FAQ Spécifique au Produit (Optionnel)</h4>
                  <p className="text-sm text-gray-500 mb-4">Les 4 premières questions (Garantie, Retour, Original, Sécurité) sont ajoutées automatiquement. Vous pouvez ajouter ici 2 questions spécifiques à ce produit.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question 5</label>
                      <input type="text" placeholder="Ex: Est-ce que la tondeuse coupe à zéro ?" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 mb-2" value={productForm.faq_q1} onChange={e => setProductForm({...productForm, faq_q1: e.target.value})} />
                      <label className="block text-sm font-medium text-gray-700 mb-2">Réponse 5</label>
                      <textarea rows={3} placeholder="Ex: Oui, sa lame en T permet une coupe très près..." className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.faq_a1} onChange={e => setProductForm({...productForm, faq_a1: e.target.value})}></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Question 6</label>
                      <input type="text" placeholder="Ex: Combien de temps dure la batterie ?" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 mb-2" value={productForm.faq_q2} onChange={e => setProductForm({...productForm, faq_q2: e.target.value})} />
                      <label className="block text-sm font-medium text-gray-700 mb-2">Réponse 6</label>
                      <textarea rows={3} placeholder="Ex: La batterie offre une autonomie de 180 minutes..." className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={productForm.faq_a2} onChange={e => setProductForm({...productForm, faq_a2: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-800">SEO &amp; Indexation (Optimisation Google)</h4>
                    <button 
                      type="button" 
                      onClick={() => {
                        let title = productForm.name ? `${productForm.name} en Algérie | ZORANDO` : '';
                        let desc = productForm.name ? `Achetez ${productForm.name} au meilleur prix en Algérie. Livraison express 58 wilayas, paiement à la livraison.` : '';
                        
                        // Function to smartly truncate without cutting words completely
                        const smartTruncate = (text: string, max: number) => {
                          if (text.length <= max) return text;
                          const truncated = text.substring(0, max);
                          const lastSpaceIndex = truncated.lastIndexOf(' ');
                          return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '...' : truncated + '...';
                        };

                        setProductForm({
                          ...productForm, 
                          seo_title: smartTruncate(title, 60), 
                          seo_description: smartTruncate(desc, 157)
                        });
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md"
                    >
                      💡 Générer suggestions SEO
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        Titre SEO * 
                        <span className={`text-xs ${(productForm.seo_title || '').length > 60 ? 'text-red-500' : 'text-gray-400'}`}>{(productForm.seo_title || '').length}/60</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                        value={productForm.seo_title || ''} 
                        onChange={e => setProductForm({...productForm, seo_title: e.target.value})} 
                      />
                      <p className="text-xs text-gray-400 mt-1">Le titre bleu qui s'affiche sur Google.</p>
                    </div>
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        Meta Description * 
                        <span className={`text-xs ${(productForm.seo_description || '').length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{(productForm.seo_description || '').length}/160</span>
                      </label>
                      <textarea 
                        rows={3} 
                        required
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                        value={productForm.seo_description || ''} 
                        onChange={e => setProductForm({...productForm, seo_description: e.target.value})}
                      ></textarea>
                      <p className="text-xs text-gray-400 mt-1">Le texte descriptif sous le titre dans Google.</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mots-clés SEO (optionnel)</label>
                    <input 
                      type="text" 
                      placeholder="Exemple : écouteurs bluetooth, hoco ew84, sans fil algérie, livraison rapide"
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                      value={productForm.seo_keywords || ''} 
                      onChange={e => setProductForm({...productForm, seo_keywords: e.target.value})} 
                    />
                    <p className="text-xs text-gray-400 mt-1">💡 Séparez par des virgules</p>
                  </div>

                  <div className="mb-4">
                     <p className="text-sm font-medium text-gray-700 mb-2">Aperçu Google (Aperçu en direct)</p>
                     <div className="p-4 border rounded-md bg-white">
                        <div className="text-[14px] text-[#1a0dab] truncate whitespace-nowrap mb-1">
                          {productForm.seo_title || "Titre du produit | ZORANDO"}
                        </div>
                        <div className="text-[13px] text-[#006621] truncate whitespace-nowrap mb-1">
                          https://www.zorando.com/product/{productForm.slug || 'slug-du-produit'}
                        </div>
                        <div className="text-[13px] text-[#545454] leading-[1.4] line-clamp-2">
                          {productForm.seo_description || "Achetez ce produit au meilleur prix en Algérie. Livraison rapide et paiement à la livraison."}
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
              
            <div className="mb-6 flex flex-wrap gap-6 px-6">
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
                <div className="flex flex-col">
                  <label className="flex items-center gap-2 text-sm font-bold text-green-600">
                    <input 
                      type="checkbox" 
                      className="rounded text-green-500 focus:ring-green-500" 
                      checked={productForm.is_active} 
                      onChange={e => setProductForm({...productForm, is_active: e.target.checked})} 
                    />
                    Actif (En ligne)
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
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                    value={subcategoryForm.name} 
                    onChange={e => {
                      const name = e.target.value;
                      const slug = generateSlug(name);
                      setSubcategoryForm({...subcategoryForm, name, slug});
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
                  <input type="text" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subcategoryForm.slug} onChange={e => setSubcategoryForm({...subcategoryForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie Parente *</label>
                  <select className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subcategoryForm.category_id} onChange={e => setSubcategoryForm({...subcategoryForm, category_id: e.target.value})}>
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
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                    value={subSubcategoryForm.name} 
                    onChange={e => {
                      const name = e.target.value;
                      const slug = generateSlug(name);
                      setSubSubcategoryForm({...subSubcategoryForm, name, slug});
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
                  <input type="text" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subSubcategoryForm.slug} onChange={e => setSubSubcategoryForm({...subSubcategoryForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie Parente *</label>
                  <select className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={subSubcategoryForm.subcategory_id} onChange={e => setSubSubcategoryForm({...subSubcategoryForm, subcategory_id: e.target.value})}>
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
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" 
                    value={categoryForm.name} 
                    onChange={e => {
                      const name = e.target.value;
                      const slug = generateSlug(name);
                      setCategoryForm({...categoryForm, name, slug});
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL) *</label>
                  <input type="text" className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500" value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image d'accueil (Miniature)</label>
                  <div className="flex items-center gap-4">
                    {categoryForm.image && (
                      <div className="relative">
                        <img src={categoryForm.image} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                        <button type="button" onClick={() => setCategoryForm({...categoryForm, image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <Trash2 size={12} />
                        </button>
                      </div>
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
                      <div className="relative">
                        <img src={categoryForm.slide_image} alt="Slide Preview" className="w-32 h-16 object-cover rounded border" />
                        <button type="button" onClick={() => setCategoryForm({...categoryForm, slide_image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <Trash2 size={12} />
                        </button>
                      </div>
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
                      <div className="relative">
                        <img src={categoryForm.mobile_slide_image} alt="Mobile Slide Preview" className="w-16 h-20 object-cover rounded border" />
                        <button type="button" onClick={() => setCategoryForm({...categoryForm, mobile_slide_image: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                          <Trash2 size={12} />
                        </button>
                      </div>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">{editingBrand ? 'Modifier la marque' : 'Ajouter une marque'}</h2>
              <button onClick={() => setIsBrandModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleBrandSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - General Info */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Informations Générales</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la marque</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                        value={brandForm.name}
                        onChange={e => setBrandForm({...brandForm, name: e.target.value, slug: generateSlug(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-gray-50"
                        value={brandForm.slug}
                        onChange={e => setBrandForm({...brandForm, slug: generateSlug(e.target.value)})}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description courte (optionnelle)</label>
                      <textarea 
                        rows={3}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                        value={brandForm.description}
                        onChange={e => setBrandForm({...brandForm, description: e.target.value})}
                      ></textarea>
                    </div>
                  </div>

                  {/* Right Column - SEO Info */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-bold text-gray-800">SEO & Contenu (Optionnel)</h3>
                      <button
                        type="button"
                        onClick={() => {
                          if (!brandForm.seo_title) setBrandForm(f => ({...f, seo_title: `${f.name} | ZORANDO - Boutique en ligne Algérie`}));
                          if (!brandForm.seo_description) setBrandForm(f => ({...f, seo_description: `Découvrez tous les produits ${f.name} disponibles chez ZORANDO. Livraison gratuite à partir de 10 000 DA en Algérie.`}));
                          if (!brandForm.h1_title) setBrandForm(f => ({...f, h1_title: f.name}));
                        }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                        title="Générer automatiquement des suggestions"
                      >
                        Suggérer
                      </button>
                    </div>
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                        Titre SEO (&lt;title&gt;) <span className={`text-xs ${brandForm.seo_title?.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>{brandForm.seo_title?.length || 0}/60</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ex: Piscines Bestway Algérie | ZORANDO - Livraison Gratuite"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-sm"
                        value={brandForm.seo_title || ''}
                        onChange={e => setBrandForm({...brandForm, seo_title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                        Meta Description <span className={`text-xs ${brandForm.seo_description?.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{brandForm.seo_description?.length || 0}/160</span>
                      </label>
                      <textarea 
                        rows={3}
                        placeholder="Ex: Achetez vos piscines Bestway en Algérie chez ZORANDO. Large choix, stock disponible, livraison gratuite..."
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-sm"
                        value={brandForm.seo_description || ''}
                        onChange={e => setBrandForm({...brandForm, seo_description: e.target.value})}
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre H1 (Titre principal affiché)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ex: Piscines Bestway Algérie - Stock Disponible"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-sm"
                        value={brandForm.h1_title || ''}
                        onChange={e => setBrandForm({...brandForm, h1_title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description SEO (Texte enrichi, HTML autorisé)
                      </label>
                      <textarea 
                        rows={5}
                        placeholder="<p>Texte enrichi à afficher au-dessus des produits...</p>"
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                        value={brandForm.seo_content || ''}
                        onChange={e => setBrandForm({...brandForm, seo_content: e.target.value})}
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">S'affiche entre le titre et les produits. (balises &lt;b&gt;, &lt;h2&gt;, &lt;ul&gt; recommandées, ~200 mots).</p>
                    </div>
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
            <div className="p-4 border-b border-gray-100 shrink-0 flex flex-col md:flex-row gap-4 bg-gray-50">
              <div className="w-full md:w-1/3">
                <input 
                  type="text" 
                  placeholder="Rechercher par nom..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="w-full md:w-1/4">
                <select
                  value={modalFilters.category_id}
                  onChange={e => setModalFilters({ ...modalFilters, category_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="w-full md:w-1/4">
                <select
                  value={modalFilters.brand_id}
                  onChange={e => setModalFilters({ ...modalFilters, brand_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Toutes les marques</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="w-full md:w-1/4">
                <input 
                  type="number" 
                  placeholder="Prix Max (DA)"
                  value={modalFilters.max_price}
                  onChange={e => setModalFilters({ ...modalFilters, max_price: e.target.value })}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>
            </div>
            <div className="p-4 border-b border-gray-100 shrink-0 flex justify-between items-center bg-white">
              <span className="text-sm text-gray-500">
                {modalProducts.length} produits trouvés
              </span>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const allIds = modalProducts.map(p => p.id.toString());
                    const newSelection = Array.from(new Set([...selectedProducts, ...allIds]));
                    setSelectedProducts(newSelection);
                  }}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={() => {
                    const allIdsToUnselect = modalProducts.map(p => p.id.toString());
                    const newSelection = selectedProducts.filter(id => !allIdsToUnselect.includes(id));
                    setSelectedProducts(newSelection);
                  }}
                  className="text-sm text-red-600 hover:underline font-medium"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingModalProducts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : modalProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Aucun produit trouvé</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {modalProducts.map(product => (
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
            )}
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
