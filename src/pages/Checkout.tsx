import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../lib/AuthContext';
import { 
  CheckCircle, Truck, MapPin, Phone, User as UserIcon, Navigation, 
  ChevronDown, ChevronUp, Plus, Building2, Lock, Mail, ArrowRight, 
  Edit3, ShieldCheck, Sparkles, AlertCircle, Eye, EyeOff, Check, ShoppingBag
} from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { formatPrice } from '../utils/formatPrice';
import { fetchWithCache } from '../lib/utils';
import { sendCapiEvent, generateEventId } from '../lib/capi';
import { useCommunesStore } from '../store/useCommunesStore';

interface Wilaya {
  id: number;
  number: string;
  name: string;
  delivery_cost: number;
  stop_desk_cost: number;
  is_active: number;
}

export default function Checkout() {
  const { items, total, clearCart } = useCartStore();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = getSupabase();
  const { communes: ALGERIA_COMMUNES, fetchCommunes } = useCommunesStore();

  const directBuyItem = location.state?.directBuyItem;
  const checkoutItems = directBuyItem ? [directBuyItem] : items;
  const checkoutTotal = directBuyItem ? (directBuyItem.selectedVariation?.price || directBuyItem.promo_price || directBuyItem.price) * directBuyItem.quantity : total();
  
  // Delivery form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    note: ''
  });

  // Auth form state (for unauthenticated checkout)
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Delivery info editing state
  const [isEditingDeliveryInfo, setIsEditingDeliveryInfo] = useState(false);
  const [showMobileCartSummary, setShowMobileCartSummary] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [trackingIds, setTrackingIds] = useState({ ga: '', fb: '' });
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'domicile' | 'bureau'>('domicile');
  const [officeId, setOfficeId] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [shippingSettings, setShippingSettings] = useState({
    percent: 30,
    message: "Profitez de -30% sur les frais de livraison aujourd'hui",
    show: true
  });

  useEffect(() => {
    fetchCommunes();
  }, [fetchCommunes]);

  // Fetch saved addresses if user is logged in
  useEffect(() => {
    if (user && supabase) {
      const fetchSavedAddresses = async () => {
        try {
          const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('profile_id', user.id);
            
          if (error) throw error;
          
          if (Array.isArray(data)) {
            setSavedAddresses(data);
            
            // Pre-fill with primary if form is empty
            const primary = data.find((a: any) => (a.is_primary || a.isPrimary));
            if (primary && !formData.wilaya) {
              setFormData(prev => ({
                ...prev,
                wilaya: primary.wilaya?.split(' ')[0] || '',
                commune: primary.commune || '',
                address: primary.address || '',
                phone: primary.phone || prev.phone
              }));
            }
          }
        } catch (e) {
          console.error("Error fetching saved addresses:", e);
        }
      };
      fetchSavedAddresses();
    }
  }, [user]);

  // Synchronize form with user & profile when available
  useEffect(() => {
    if (user && wilayas.length > 0) {
      let wilayaNum = profile?.wilaya || '';
      if (isNaN(Number(wilayaNum))) {
        const found = wilayas.find(w => w.name === profile?.wilaya);
        if (found) wilayaNum = found.number;
      }

      const extractedName = (profile?.first_name || profile?.firstName)
        ? `${profile?.first_name || profile?.firstName} ${profile?.last_name || profile?.lastName || ''}`.trim()
        : (user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.first_name || '');

      setFormData(prev => ({
        ...prev,
        name: prev.name || extractedName,
        email: user.email || prev.email,
        phone: prev.phone || profile?.phone || user.user_metadata?.phone || '',
        wilaya: prev.wilaya || wilayaNum,
        commune: prev.commune || profile?.commune || '',
        address: prev.address || profile?.full_address || profile?.fullAddress || ''
      }));

      // Set delivery cost if wilaya found
      const activeWilayaNum = formData.wilaya || wilayaNum;
      const selectedWilaya = wilayas.find(w => w.number === activeWilayaNum);
      if (selectedWilaya) {
        const cost = deliveryMode === 'domicile' 
          ? Number(selectedWilaya.delivery_cost) 
          : Number(selectedWilaya.stop_desk_cost || 0);
        setDeliveryCost(cost);
        setDeliveryTime('24h-72h');
      }
    } else if (user) {
      // Just logged in with Google, profile might still be loading
      const extractedName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.first_name || '';
      setFormData(prev => ({
        ...prev,
        name: prev.name || extractedName,
        email: user.email || prev.email,
        phone: prev.phone || user.user_metadata?.phone || ''
      }));
    }
  }, [user, profile, wilayas]);

  // Shipping discount state
  const [isShippingDiscountApplied, setIsShippingDiscountApplied] = useState(false);
  const [discountEmail, setDiscountEmail] = useState('');
  const [showDiscountOffer, setShowDiscountOffer] = useState(true);

  const itemCount = checkoutItems.reduce((acc, item) => acc + item.quantity, 0);
  const isFreeShipping = checkoutTotal >= 10000 && itemCount >= 3;

  const effectiveDeliveryCost = isFreeShipping 
    ? 0 
    : (isShippingDiscountApplied ? deliveryCost * (1 - shippingSettings.percent / 100) : deliveryCost);
  
  const finalTotal = checkoutTotal + effectiveDeliveryCost;

  const handleApplyDiscount = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!discountEmail || !/^\S+@\S+\.\S+$/.test(discountEmail)) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }
    
    try {
      fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: discountEmail, source: 'discount_offer' })
      }).catch(err => console.error('Failed to subscribe:', err));

      setFormData({ ...formData, email: discountEmail });
      setIsShippingDiscountApplied(true);
      setShowDiscountOffer(false);
      toast.success('Réduction appliquée avec succès !');
    } catch (error) {
      console.error('Error applying discount:', error);
    }
  };

  useEffect(() => {
    const fetchWilayasAndOffices = async () => {
      try {
        const data = await fetchWithCache('/api/wilayas');
        if (Array.isArray(data)) {
          setWilayas(data.filter((w: any) => w.is_active === true || w.is_active === 1));
        }
        const officesData = await fetchWithCache('/api/all-stopdesks');
        if (Array.isArray(officesData)) setOffices(officesData);
      } catch (error) {
        console.error('Failed to fetch wilayas or offices:', error);
      }
    };
    fetchWilayasAndOffices();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchWithCache('/api/settings', { signal: controller.signal })
      .then(data => {
        const settings = data as any;
        setTrackingIds({
          ga: settings.ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID || '',
          fb: settings.fb_pixel_id || import.meta.env.VITE_FB_PIXEL_ID || ''
        });

        if (settings.shipping_discount_percent !== undefined) {
          setShippingSettings({
            percent: parseInt(settings.shipping_discount_percent) || 30,
            message: settings.shipping_discount_message || "Profitez de -30% sur les frais de livraison aujourd'hui",
            show: settings.show_shipping_discount !== 'false'
          });
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const selectedWilaya = wilayas.find(w => w.number === formData.wilaya);
    if (selectedWilaya) {
      const cost = deliveryMode === 'domicile' 
        ? Number(selectedWilaya.delivery_cost) 
        : Number(selectedWilaya.stop_desk_cost || 0);
      setDeliveryCost(cost);
      setDeliveryTime('24h-72h');
    } else {
      setDeliveryCost(0);
      setDeliveryTime('');
    }
  }, [deliveryMode, formData.wilaya, wilayas]);

  const initiateCheckoutTrackedRef = React.useRef(false);

  useEffect(() => {
    if (checkoutItems.length > 0 && !initiateCheckoutTrackedRef.current) {
      initiateCheckoutTrackedRef.current = true;
      const eventId = generateEventId();
      const safeValue = isNaN(checkoutTotal) || checkoutTotal <= 0 ? 1 : Number(Number(checkoutTotal).toFixed(2));
      
      // GA4 begin_checkout event
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        try {
          window.gtag("event", "begin_checkout", {
            currency: "DZD",
            value: safeValue,
            items: checkoutItems.map(item => ({
              item_id: item.id.toString(),
              item_name: item.name,
              price: item.selectedVariation?.price || item.promo_price || item.price,
              quantity: item.quantity,
              item_category: item.category_name || undefined
            }))
          });
        } catch (e) {
          console.error('Failed to send GA begin_checkout event', e);
        }
      }

      if (trackingIds.fb) {
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'InitiateCheckout', {
            value: safeValue,
            currency: 'DZD',
            content_ids: checkoutItems.map(item => String(item.id)),
            content_type: 'product',
            num_items: checkoutItems.reduce((acc, item) => acc + item.quantity, 0)
          }, { eventID: eventId });
        }
        
        sendCapiEvent({
          eventName: 'InitiateCheckout',
          eventId: eventId,
          customData: {
            value: safeValue,
            currency: 'DZD',
            content_ids: checkoutItems.map(item => String(item.id)),
            content_type: 'product',
            num_items: checkoutItems.reduce((acc, item) => acc + item.quantity, 0)
          }
        });
      }
    }
  }, [trackingIds.fb, checkoutItems, checkoutTotal]);

  useEffect(() => {
    if (!directBuyItem && items.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [items, navigate, orderSuccess, directBuyItem]);

  const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, commune: e.target.value });
    setOfficeId('');
  };

  const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wilayaNumber = e.target.value;
    setFormData({ ...formData, wilaya: wilayaNumber, commune: '' });
    setOfficeId('');
  };

  const handleSelectSavedAddress = (addr: any) => {
    let wilayaNumber = addr.wilaya?.split(' ')[0] || '';
    if (isNaN(Number(wilayaNumber)) && wilayas.length > 0) {
      const found = wilayas.find(w => w.name === addr.wilaya);
      if (found) wilayaNumber = found.number;
    }

    setFormData(prev => ({
      ...prev,
      wilaya: wilayaNumber,
      commune: addr.commune || '',
      address: addr.address || '',
      phone: addr.phone || prev.phone
    }));
    setOfficeId('');
    setShowAddressPicker(false);
    toast.success('Adresse sélectionnée');
  };

  // Google OAuth handler with return to /checkout
  const handleGoogleLogin = async () => {
    if (!supabase) {
      toast.error("Erreur de configuration : Impossible de se connecter à la base de données.");
      return;
    }
    try {
      localStorage.setItem('zorando_auth_redirect', '/checkout');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error('Échec de la connexion avec Google: ' + (error.message || 'erreur inconnue'));
    }
  };

  // Email authentication (sign up or sign in directly within checkout)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error('Erreur de configuration de la base de données.');
      return;
    }
    setIsAuthSubmitting(true);
    try {
      if (authMode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              first_name: authFirstName,
              last_name: authLastName,
            }
          }
        });
        if (error) throw error;

        if (data.user) {
          // Create initial profile in profiles table
          await supabase.from('profiles').upsert({
            id: data.user.id,
            first_name: authFirstName,
            last_name: authLastName,
            email: authEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          await refreshProfile();
        }
        toast.success('Compte créé avec succès ! Bienvenue chez Zorando.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        toast.success('Bon retour sur Zorando !');
        await refreshProfile();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || 'Erreur lors de l\'authentification.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Check if current user has all required delivery details
  const isDeliveryInfoComplete = Boolean(
    formData.name?.trim() &&
    formData.phone?.trim() &&
    formData.wilaya?.trim() &&
    formData.commune?.trim() &&
    (deliveryMode === 'bureau' ? officeId : formData.address?.trim())
  );

  // Save / Complete Delivery Profile and proceed to confirmation
  const handleSaveDeliveryInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error('Veuillez renseigner votre nom complet');
      return;
    }

    const phoneRegex = /^(0[567]\d{8}|(?:\+213|00213)[567]\d{8})$/;
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Veuillez entrer un numéro de téléphone valide (ex: 0555 12 34 56)');
      return;
    }

    if (!formData.wilaya) {
      toast.error('Veuillez sélectionner une wilaya');
      return;
    }

    if (!formData.commune) {
      toast.error('Veuillez sélectionner une commune');
      return;
    }

    if (deliveryMode === 'domicile' && !formData.address?.trim()) {
      toast.error('Veuillez préciser votre adresse de livraison complète');
      return;
    }

    if (deliveryMode === 'bureau' && !officeId) {
      toast.error('Veuillez sélectionner un point relais de retrait');
      return;
    }

    setIsSavingProfile(true);
    try {
      if (user && supabase) {
        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Upsert profiles table in Supabase
        await supabase.from('profiles').upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: user.email || formData.email,
          phone: formData.phone,
          wilaya: formData.wilaya,
          commune: formData.commune,
          full_address: formData.address,
          updated_at: new Date().toISOString()
        });

        // Save as primary address for future 1-click orders
        if (deliveryMode === 'domicile' && formData.address) {
          await supabase.from('addresses').upsert({
            profile_id: user.id,
            title: 'Adresse principale',
            first_name: firstName,
            last_name: lastName,
            phone: formData.phone,
            wilaya: formData.wilaya,
            commune: formData.commune,
            address: formData.address,
            is_primary: true,
            updated_at: new Date().toISOString()
          });
        }

        await refreshProfile();
      }

      setIsEditingDeliveryInfo(false);
      toast.success('Informations enregistrées !');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error('Erreur lors de la sauvegarde: ' + (err.message || ''));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Submit Final Order
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const phoneRegex = /^(0[567]\d{8}|(?:\+213|00213)[567]\d{8})$/;
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      setIsSubmitting(false);
      return;
    }

    const isBureau = deliveryMode === 'bureau';
    const selectedOffice = isBureau ? offices.find(o => o.id === Number(officeId) || o.id === officeId) : null;
    const finalAddress = isBureau && selectedOffice ? `Point Relais: ${selectedOffice.name} - ${selectedOffice.address}` : formData.address;

    const orderData = {
      customer_name: formData.name,
      customer_email: formData.email || user?.email || '',
      customer_phone: formData.phone,
      wilaya: wilayas.find(w => w.number === formData.wilaya)?.name || formData.wilaya,
      commune: isBureau && selectedOffice ? selectedOffice.commune : formData.commune,
      address: finalAddress,
      note: formData.note,
      total_amount: finalTotal,
      delivery_cost: effectiveDeliveryCost,
      stop_desk: deliveryMode === 'bureau',
      office_id: deliveryMode === 'bureau' && selectedOffice ? selectedOffice.original_id : null,
      office_name: deliveryMode === 'bureau' && selectedOffice ? selectedOffice.name : null,
      delivery_company: deliveryMode === 'bureau' && selectedOffice ? selectedOffice.company : 'ecomdz',
      customer_user_id: user?.id || null,
      items: checkoutItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.selectedVariation?.price || item.promo_price || item.price,
        variation: item.selectedVariation ? `${item.selectedVariation.attribute} : ${item.selectedVariation.value}` : null
      }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        const responseData = await res.json();
        setCreatedOrderId(responseData.order_id || `#${responseData.id}`);
        setOrderSuccess(true);
        if (!directBuyItem) {
          clearCart();
        }
        
        // Track Purchase
        const finalTotalVal = checkoutTotal + deliveryCost;
        const safeValue = isNaN(finalTotalVal) || finalTotalVal <= 0 ? 1 : Number(Number(finalTotalVal).toFixed(2));

        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          try {
            window.gtag("event", "purchase", {
              transaction_id: String(responseData.order_id || responseData.id),
              value: safeValue,
              currency: "DZD",
              shipping: deliveryCost,
              items: checkoutItems.map(item => ({
                item_id: item.id.toString(),
                item_name: item.name,
                price: item.selectedVariation?.price || item.promo_price || item.price,
                quantity: item.quantity,
                item_category: item.category_name || undefined
              }))
            });
            
            // Explicit Google Ads Conversion
            window.gtag('event', 'conversion', {
              'send_to': 'AW-18384476935/KcjbCLSx-98cEIe2s75E',
              'value': safeValue,
              'currency': 'DZD',
              'transaction_id': String(responseData.order_id || responseData.id)
            });
          } catch (e) {
            console.error('Failed to send GA purchase event', e);
          }
        }
        
        if (trackingIds.fb) {
          try {
            const eventId = String(responseData.order_id || responseData.id || `CMD-${Date.now()}`);
            
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            
            const advancedMatching: any = {};
            if (formData.email) advancedMatching.em = formData.email.trim().toLowerCase();
            if (formData.phone) advancedMatching.ph = formData.phone.replace(/[^0-9]/g, '');
            if (firstName) advancedMatching.fn = firstName.toLowerCase();
            if (lastName) advancedMatching.ln = lastName.toLowerCase();
            
            if (typeof window !== 'undefined' && (window as any).fbq) {
              if (Object.keys(advancedMatching).length > 0) {
                (window as any).fbq('init', trackingIds.fb, advancedMatching);
              }
              (window as any).fbq('track', 'Purchase', {
                value: safeValue,
                currency: 'DZD',
                content_ids: checkoutItems.map(item => String(item.id)),
                content_type: 'product'
              }, { eventID: eventId });
            }
            
            sendCapiEvent({
              eventName: 'Purchase',
              eventId: eventId,
              userData: {
                email: formData.email,
                phone: formData.phone,
                firstName: firstName,
                lastName: lastName
              },
              customData: {
                value: safeValue,
                currency: 'DZD',
                content_ids: checkoutItems.map(item => String(item.id)),
                content_type: 'product'
              }
            });
          } catch (e) {
            console.error('Failed to send FB purchase event', e);
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de la validation de la commande');
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <SEO title="Commande Confirmée - ZORANDO" description="Votre commande ZORANDO a été confirmée avec succès." noindex={true} />
        <div className="bg-green-100 p-6 rounded-full text-green-500 mb-6 animate-bounce">
          <CheckCircle size={64} />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 px-4">
          Félicitations, commande confirmée !
        </h1>
        {createdOrderId && (
          <div className="bg-orange-50 border border-orange-200 px-6 py-3 rounded-xl mb-6 inline-block shadow-sm">
            <span className="text-gray-600 text-sm mr-2 font-medium">Numéro de commande :</span>
            <span className="font-extrabold text-orange-600 text-lg">{createdOrderId}</span>
          </div>
        )}
        <p className="text-gray-600 mb-6 max-w-md text-base leading-relaxed">
          Merci pour votre confiance sur <span className="font-bold text-gray-900">ZORANDO</span>. Votre commande a été transmise à notre service logistique. Vous recevrez un appel de notre service client avant l'expédition.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => navigate('/account/orders')}
            className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm"
          >
            Suivre mes commandes
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  }

  // Helper for filtered offices in current wilaya/commune
  const filteredOffices = offices.filter(o => {
    const matchWilaya = !formData.wilaya || Number(o.wilaya) === Number(formData.wilaya);
    if (!matchWilaya) return false;
    if (!formData.commune) return true;
    if (!o.commune) return false;
    
    const normalizeCommune = (s: string) => (s||'').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, '').replace(/[aeiouy]/g, '');
    const c1 = normalizeCommune(o.commune);
    const c2 = normalizeCommune(formData.commune);
    
    return c1 === c2 || 
      o.commune.toLowerCase().includes(formData.commune.toLowerCase()) || 
      formData.commune.toLowerCase().includes(o.commune.toLowerCase());
  });

  const selectedOfficeObj = deliveryMode === 'bureau' ? offices.find(o => String(o.id) === String(officeId)) : null;

  return (
    <>
      <SEO title="Commander - ZORANDO" description="Finalisez votre commande en toute sécurité sur ZORANDO." noindex={true} />

      <div className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
        
        {/* Mobile Quick Cart Accordion */}
        <div className="lg:hidden mb-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button 
            type="button"
            onClick={() => setShowMobileCartSummary(!showMobileCartSummary)}
            className="w-full px-4 py-3.5 flex items-center justify-between bg-gray-50/80 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <ShoppingBag size={18} className="text-orange-500" />
              <span>Récapitulatif ({itemCount} {itemCount > 1 ? 'articles' : 'article'})</span>
              <span className="text-xs text-orange-600 font-bold ml-1">
                {showMobileCartSummary ? 'Masquer' : 'Afficher'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-orange-600">{formatPrice(finalTotal)}</span>
              {showMobileCartSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {showMobileCartSummary && (
            <div className="p-4 border-t border-gray-200 space-y-3 bg-white animate-fade-in">
              {checkoutItems.map(item => (
                <div key={item.cartItemId || item.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500">{item.quantity}x</span>
                    <span className="text-gray-800 line-clamp-1">{item.name}</span>
                  </div>
                  <span className="font-semibold">{formatPrice((item.selectedVariation?.price || item.promo_price || item.price) * item.quantity)}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between text-xs text-gray-500">
                <span>Frais de livraison :</span>
                <span className="font-medium text-gray-700">
                  {effectiveDeliveryCost === 0 ? 'Gratuit' : formatPrice(effectiveDeliveryCost)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stepper Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto mb-4">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                !user ? 'bg-orange-500 text-white ring-4 ring-orange-100' : 'bg-green-500 text-white'
              }`}>
                {!user ? '1' : <Check size={18} />}
              </div>
              <span className="text-xs font-semibold mt-1 text-gray-700">Compte</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 rounded ${user ? 'bg-green-500' : 'bg-gray-200'}`} />

            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                !user 
                  ? 'bg-gray-200 text-gray-500' 
                  : (!isDeliveryInfoComplete || isEditingDeliveryInfo)
                    ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                    : 'bg-green-500 text-white'
              }`}>
                {(!isDeliveryInfoComplete || isEditingDeliveryInfo) || !user ? '2' : <Check size={18} />}
              </div>
              <span className="text-xs font-semibold mt-1 text-gray-700">Livraison</span>
            </div>

            <div className={`flex-1 h-1 mx-2 rounded ${user && isDeliveryInfoComplete && !isEditingDeliveryInfo ? 'bg-green-500' : 'bg-gray-200'}`} />

            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                user && isDeliveryInfoComplete && !isEditingDeliveryInfo 
                  ? 'bg-orange-500 text-white ring-4 ring-orange-100' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
              <span className="text-xs font-semibold mt-1 text-gray-700">Validation</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* MAIN INTERACTIVE COLUMN */}
          <div className="w-full lg:w-2/3">

            {/* ========================================================
                CASE A: USER NOT LOGGED IN -> PROFESSIONAL AUTH MODAL
               ======================================================== */}
            {!user ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 animate-fade-in">
                
                {/* Header requested by user */}
                <div className="text-center max-w-md mx-auto mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-100 rounded-2xl text-orange-600 mb-3 shadow-sm">
                    <UserIcon size={28} />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Créez votre compte pour continuer
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    Créez votre compte en quelques secondes pour enregistrer vos informations et faciliter vos prochaines commandes.
                  </p>
                </div>

                {/* 🔵 PRIMARY ACTION: GOOGLE OAUTH */}
                <div className="max-w-md mx-auto space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl border-2 border-gray-200 shadow-sm transition-all hover:border-gray-300 active:scale-[0.99] text-base"
                  >
                    <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                      <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    <span>Continuer avec Google</span>
                  </button>

                  {/* Elegant Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-gray-400 font-bold tracking-wider">
                        ou avec votre e-mail
                      </span>
                    </div>
                  </div>

                  {/* Tab Selector between Register and Login */}
                  <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl mb-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className={`py-2 rounded-lg transition-all ${
                        authMode === 'register' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      ✉️ Créer un compte
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`py-2 rounded-lg transition-all ${
                        authMode === 'login' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Déjà client ? Se connecter
                    </button>
                  </div>

                  {/* Email Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    {authMode === 'register' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Amine"
                            value={authFirstName}
                            onChange={(e) => setAuthFirstName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Nom *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Benali"
                            value={authLastName}
                            onChange={(e) => setAuthLastName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Adresse e-mail *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="votre@email.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Mot de passe *
                        </label>
                        {authMode === 'login' && (
                          <Link to="/account/forgot-password" className="text-xs text-orange-600 hover:underline">
                            Mot de passe oublié ?
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthSubmitting}
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isAuthSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{authMode === 'register' ? 'Créer mon compte et continuer' : 'Me connecter et continuer'}</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Reassurance items */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={14} className="text-green-600" /> Données 100% sécurisées
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck size={14} className="text-orange-500" /> Paiement à la livraison
                    </span>
                  </div>

                </div>

              </div>
            ) : (!isDeliveryInfoComplete || isEditingDeliveryInfo) ? (
              
              /* ========================================================
                 CASE B: LOGGED IN BUT INCOMPLETE INFO -> COMPLETE DELIVERY FORM
                 ======================================================== */
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 animate-fade-in">
                
                <div className="border-b pb-4 mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full mb-2">
                    <Sparkles size={14} /> Étape 2 : Livraison
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                    Complétez vos informations de livraison
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Ces coordonnées permettront au livreur de vous contacter et de remettre votre colis.
                  </p>
                </div>

                <form onSubmit={handleSaveDeliveryInfo} className="space-y-5">

                  {/* Nom complet */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nom et prénom *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Amine Benali"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* E-mail (already known, locked / verified) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      E-mail (Compte Zorando)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        readOnly
                        value={user?.email || formData.email}
                        className="w-full pl-9 pr-24 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 text-sm font-medium outline-none cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={12} /> Vérifié
                      </span>
                    </div>
                  </div>

                  {/* Téléphone (High priority in Algeria) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Numéro de téléphone * (L'appel du livreur se fera sur ce numéro)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                      <input
                        type="tel"
                        required
                        placeholder="Ex: 0555 12 34 56"
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d+]/g, '');
                          setFormData({ ...formData, phone: val });
                        }}
                        className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all ${
                          !formData.phone ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-300 focus:ring-2 focus:ring-orange-500'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Numéros acceptés : Mobilis (06), Djezzy (07), Ooredoo (05).
                    </p>
                  </div>

                  {/* Wilaya & Commune */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Wilaya de livraison *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                          required
                          value={formData.wilaya}
                          onChange={handleWilayaChange}
                          className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium outline-none transition-all appearance-none bg-white"
                        >
                          <option value="" disabled>Sélectionnez votre wilaya</option>
                          {wilayas.map(w => (
                            <option key={w.number} value={w.number}>{w.number} - {w.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Commune de livraison *
                      </label>
                      <div className="relative">
                        <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                          required
                          disabled={!formData.wilaya}
                          value={formData.commune}
                          onChange={handleCommuneChange}
                          className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium outline-none transition-all appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled>{!formData.wilaya ? 'D\'abord choisir une wilaya' : 'Sélectionnez votre commune'}</option>
                          {formData.wilaya && ALGERIA_COMMUNES[formData.wilaya]?.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Mode de livraison: Domicile vs Stopdesk */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Mode de livraison *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`cursor-pointer rounded-xl border-2 p-3.5 flex flex-col items-center justify-center transition-all ${
                        deliveryMode === 'domicile' ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryMode"
                          value="domicile"
                          checked={deliveryMode === 'domicile'}
                          onChange={() => setDeliveryMode('domicile')}
                          className="sr-only"
                        />
                        <Truck size={22} className={`mb-1.5 ${deliveryMode === 'domicile' ? 'text-orange-600' : 'text-gray-400'}`} />
                        <span className="font-bold text-sm">À domicile</span>
                        <span className="text-[11px] text-gray-500 mt-0.5">Livré directement chez vous</span>
                      </label>

                      <label className={`cursor-pointer rounded-xl border-2 p-3.5 flex flex-col items-center justify-center transition-all ${
                        deliveryMode === 'bureau' ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryMode"
                          value="bureau"
                          checked={deliveryMode === 'bureau'}
                          onChange={() => setDeliveryMode('bureau')}
                          className="sr-only"
                        />
                        <Building2 size={22} className={`mb-1.5 ${deliveryMode === 'bureau' ? 'text-orange-600' : 'text-gray-400'}`} />
                        <span className="font-bold text-sm">En point relais</span>
                        <span className="text-[11px] text-gray-500 mt-0.5">Retrait en bureau de livraison</span>
                      </label>
                    </div>
                  </div>

                  {/* Point Relais Selection if Bureau */}
                  {deliveryMode === 'bureau' && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                        Sélectionnez votre point relais de retrait *
                      </label>

                      {!formData.wilaya ? (
                        <p className="text-xs text-orange-700">Veuillez d'abord sélectionner une wilaya ci-dessus.</p>
                      ) : filteredOffices.length === 0 ? (
                        <p className="text-xs text-gray-500">Aucun point relais disponible dans cette commune. Choisissez la livraison à domicile ou une commune voisine.</p>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {filteredOffices.map(office => (
                            <label
                              key={office.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                String(officeId) === String(office.id)
                                  ? 'border-orange-500 bg-white ring-2 ring-orange-200'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="selectedOffice"
                                value={office.id}
                                checked={String(officeId) === String(office.id)}
                                onChange={(e) => setOfficeId(e.target.value)}
                                className="mt-1 w-4 h-4 text-orange-600 focus:ring-orange-500"
                              />
                              <div className="text-xs">
                                <div className="font-bold text-gray-900">{office.name}</div>
                                <div className="text-gray-600 mt-0.5">{office.address} ({office.commune})</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Domicile: Full Address */}
                  {deliveryMode === 'domicile' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Adresse complète de livraison *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Ex: Cité 500 logements, Bâtiment B, Porte 12"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium outline-none transition-all resize-none"
                      />
                    </div>
                  )}

                  {/* Action Button: Save & Advance */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex-1 py-3.5 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Enregistrer mes informations et continuer</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                    {isDeliveryInfoComplete && isEditingDeliveryInfo && (
                      <button
                        type="button"
                        onClick={() => setIsEditingDeliveryInfo(false)}
                        className="py-3 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-bold transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>

                </form>

              </div>

            ) : (

              /* ========================================================
                 CASE C: PROFILE COMPLETE -> INSTANT REVIEW & 1-CLICK CONFIRMATION
                 ======================================================== */
              <div className="space-y-6 animate-fade-in">
                
                {/* Delivery Information Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <div className="flex items-center justify-between border-b pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                        <CheckCircle size={22} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Adresse de livraison validée</h2>
                        <p className="text-xs text-gray-500">Prêt pour l'expédition en 1 clic</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingDeliveryInfo(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                    >
                      <Edit3 size={14} /> Modifier
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Destinataire</span>
                      <span className="font-bold text-gray-900 text-base">{formData.name}</span>
                      <div className="text-gray-600 mt-1 flex items-center gap-1.5">
                        <Phone size={14} className="text-gray-400" />
                        <span className="font-semibold text-gray-900">{formData.phone}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Lieu de livraison</span>
                      <div className="font-semibold text-gray-900">
                        {wilayas.find(w => w.number === formData.wilaya)?.name || formData.wilaya} — {formData.commune}
                      </div>
                      <div className="text-gray-600 text-xs mt-1">
                        {deliveryMode === 'bureau' ? (
                          <span className="inline-flex items-center gap-1 text-orange-700 font-medium">
                            <Building2 size={13} /> {selectedOfficeObj ? `Point relais : ${selectedOfficeObj.name}` : 'En point relais'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Truck size={13} className="text-gray-400" /> {formData.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Note */}
                  <div className="mt-5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Note pour le livreur (Optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Appeler avant d'arriver, ou laisser chez le gardien"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Payment Method Badge */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-800 text-base mb-3">Mode de paiement</h3>
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400/80 rounded-xl p-4 flex items-center gap-4">
                    <div className="bg-white p-2.5 rounded-xl text-orange-500 shadow-sm shrink-0">
                      <Truck size={24} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-orange-950 text-sm">Paiement à la livraison (Cash on Delivery)</h4>
                      <p className="text-xs text-orange-800/90 mt-0.5">Payez en espèces en toute sérénité à la réception de votre colis.</p>
                    </div>
                  </div>
                </div>

                {/* Confirm Order CTA for Mobile & Desktop inside main view */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-gray-500 block">Total à payer à la livraison</span>
                    <span className="text-2xl font-black text-orange-600">{formatPrice(finalTotal)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-base rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={20} />
                        <span>Confirmer ma commande</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: RECAP & REASSURANCE */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24 space-y-6">
              
              <div className="border-b pb-4">
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center justify-between">
                  <span>Votre commande</span>
                  <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {itemCount} {itemCount > 1 ? 'articles' : 'article'}
                  </span>
                </h3>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {checkoutItems.map(item => {
                  const currentPrice = item.selectedVariation?.price || item.promo_price || item.price;
                  const itemImg = item.selectedVariation?.image 
                    ? (item.selectedVariation.image.startsWith('http') || item.selectedVariation.image.startsWith('/api') ? item.selectedVariation.image : '/api/images/' + item.selectedVariation.image) 
                    : item.image;

                  return (
                    <div key={item.cartItemId || item.id} className="flex gap-3 text-sm items-center py-2 border-b border-gray-50 last:border-0">
                      <img 
                        src={itemImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=100`}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 line-clamp-1 text-xs">{item.name}</h4>
                        {item.selectedVariation && (
                          <p className="text-[10px] text-gray-500">{item.selectedVariation.attribute}: {item.selectedVariation.value}</p>
                        )}
                        <span className="text-[11px] text-gray-500 font-bold">{item.quantity} × {formatPrice(currentPrice)}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-xs shrink-0">
                        {formatPrice(currentPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Pricing breakdown */}
              <div className="border-t pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span className="font-semibold text-gray-900">{formatPrice(checkoutTotal)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Livraison ({deliveryMode === 'bureau' ? 'Point Relais' : 'Domicile'})</span>
                  {isFreeShipping ? (
                    <span className="font-bold text-green-600">Gratuit</span>
                  ) : deliveryCost > 0 ? (
                    <span className="font-semibold text-orange-600">+{formatPrice(effectiveDeliveryCost)}</span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Calculé selon la wilaya</span>
                  )}
                </div>

                {deliveryTime && (
                  <div className="text-[11px] text-green-700 bg-green-50 px-2 py-1 rounded-lg text-center font-medium">
                    ⚡ Délai estimé de livraison : {deliveryTime}
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-black text-gray-900 text-base">Total à payer</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-orange-600">{formatPrice(finalTotal)}</span>
                    <div className="text-[10px] text-gray-400 font-medium">TVA incluse • Paiement en espèces</div>
                  </div>
                </div>
              </div>

              {/* Reassurance list */}
              <div className="pt-2 border-t space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-orange-500" />
                  <span>Livraison express sur 58 Wilayas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span>Vérification du colis avant paiement</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-500" />
                  <span>Garantie Zorando Premium</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </>
  );
}
