import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../lib/AuthContext';
import { CheckCircle, Truck, MapPin, Phone, User as UserIcon, Navigation, ChevronDown, Plus, Building2 } from 'lucide-react';
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
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = getSupabase();
  const { communes: ALGERIA_COMMUNES, fetchCommunes } = useCommunesStore();

  const directBuyItem = location.state?.directBuyItem;
  const checkoutItems = directBuyItem ? [directBuyItem] : items;
  const checkoutTotal = directBuyItem ? (directBuyItem.selectedVariation?.price || directBuyItem.promo_price || directBuyItem.price) * directBuyItem.quantity : total();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    note: ''
  });
  
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [trackingIds, setTrackingIds] = useState({ ga: '', fb: '' });
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'domicile' | 'bureau'>('domicile');

  useEffect(() => {
    fetchCommunes();
  }, [fetchCommunes]);
  const [officeId, setOfficeId] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [shippingSettings, setShippingSettings] = useState({
    percent: 30,
    message: "Profitez de -30% sur les frais de livraison aujourd'hui",
    show: true
  });

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
                address: primary.address,
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

  useEffect(() => {
    if (user && profile && wilayas.length > 0) {
      // Find wilaya number from name if stored as name
      let wilayaNum = profile.wilaya || '';
      if (isNaN(Number(wilayaNum))) {
        const found = wilayas.find(w => w.name === profile.wilaya);
        if (found) wilayaNum = found.number;
      }

      setFormData(prev => ({
        ...prev,
        name: (profile.first_name || profile.firstName) ? `${profile.first_name || profile.firstName} ${profile.last_name || profile.lastName || ''}`.trim() : (user.user_metadata?.first_name || prev.name),
        email: user.email || prev.email,
        phone: profile.phone || prev.phone,
        wilaya: wilayaNum,
        commune: profile.commune || prev.commune,
        address: profile.full_address || profile.fullAddress || prev.address
      }));

      // Set delivery cost if wilaya found
      const selectedWilaya = wilayas.find(w => w.number === wilayaNum);
      if (selectedWilaya) {
        const cost = deliveryMode === 'domicile' 
          ? Number(selectedWilaya.delivery_cost) 
          : Number(selectedWilaya.stop_desk_cost || 0);
        setDeliveryCost(cost);
        setDeliveryTime('24h-72h');
      }
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
      // Save to subscribers table
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
        const officesData = await fetchWithCache('/api/offices');
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
      setDeliveryTime('24h-72h'); // On pourrait rendre cela dynamique aussi
    } else {
      setDeliveryCost(0);
      setDeliveryTime('');
    }
  }, [deliveryMode, formData.wilaya, wilayas]);

  const initiateCheckoutTrackedRef = React.useRef(false);

  useEffect(() => {
    if (trackingIds.fb && checkoutItems.length > 0 && !initiateCheckoutTrackedRef.current) {
      initiateCheckoutTrackedRef.current = true;
      const eventId = generateEventId();
      const safeValue = isNaN(checkoutTotal) || checkoutTotal <= 0 ? 1 : Number(Number(checkoutTotal).toFixed(2));
      
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', {
          value: safeValue,
          currency: 'DZD',
          content_ids: checkoutItems.map(item => item.id.toString()),
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
          content_ids: checkoutItems.map(item => item.id.toString()),
          content_type: 'product',
          num_items: checkoutItems.reduce((acc, item) => acc + item.quantity, 0)
        }
      });
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
      address: addr.address,
      phone: addr.phone || prev.phone
    }));
    setOfficeId('');
    
    setShowAddressPicker(false);
    toast.success('Adresse sélectionnée');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      customer_email: formData.email,
      customer_phone: formData.phone,
      wilaya: wilayas.find(w => w.number === formData.wilaya)?.name || formData.wilaya,
      commune: isBureau && selectedOffice ? selectedOffice.commune : formData.commune,
      address: finalAddress,
      note: formData.note,
      total_amount: finalTotal,
      delivery_cost: effectiveDeliveryCost,
      stop_desk: deliveryMode === 'bureau',
      office_id: deliveryMode === 'bureau' ? officeId : null,
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
        const finalTotal = checkoutTotal + deliveryCost;
        const safeValue = isNaN(finalTotal) || finalTotal <= 0 ? 1 : Number(Number(finalTotal).toFixed(2));

        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          try {
            window.gtag("event", "purchase", {
              transaction_id: Date.now().toString(),
              value: safeValue,
              currency: "DZD",
              shipping: deliveryCost,
              items: checkoutItems.map(item => ({
                item_id: item.id.toString(),
                item_name: item.name,
                price: item.promo_price || item.price,
                quantity: item.quantity
              }))
            });
          } catch (e) {
            console.error('Failed to send GA purchase event', e);
          }
        }
        
        if (trackingIds.fb) {
          try {
            const eventId = responseData.order_id || responseData.id.toString();
            if (typeof window !== 'undefined' && (window as any).fbq) {
              (window as any).fbq('track', 'Purchase', {
                value: safeValue,
                currency: 'DZD',
                content_ids: checkoutItems.map(item => item.id.toString()),
                content_type: 'product'
              }, { eventID: eventId });
            }
            
            // Extract first and last name from full name
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

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
                content_ids: checkoutItems.map(item => item.id.toString()),
                content_type: 'product'
              }
            });
          } catch (e) {
            console.error('Failed to send FB purchase event', e);
          }
        }

        // Mock notification
        console.log(`Notification envoyée à ${formData.phone} via WhatsApp`);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de la commande');
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="bg-green-100 p-6 rounded-full text-green-500 mb-6">
          <CheckCircle size={64} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 px-4">Commande Confirmée !</h1>
        {createdOrderId && (
          <div className="bg-gray-100 px-6 py-3 rounded-lg mb-6 inline-block">
            <span className="text-gray-600 mr-2">Numéro de commande:</span>
            <span className="font-bold text-gray-900 text-lg">{createdOrderId}</span>
          </div>
        )}
        <p className="text-gray-600 mb-8 max-w-md">
          Merci pour votre achat. Votre commande a été enregistrée avec succès. 
          Vous recevrez bientôt un appel de confirmation.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-md"
        >
          Retourner à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 px-4">Finaliser la commande</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form */}
        <div className="w-full lg:w-2/3">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <UserIcon size={20} className="text-orange-500" />
                Informations de livraison
              </h2>
              {user && savedAddresses.length > 0 && (
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowAddressPicker(!showAddressPicker)}
                    className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-orange-100 transition-colors"
                  >
                    <MapPin size={12} /> Vos adresses <ChevronDown size={12} />
                  </button>
                  
                  {showAddressPicker && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 space-y-1 animate-fade-in">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Sélectionnez une adresse</p>
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                        >
                          <p className="text-sm font-bold text-gray-900 flex items-center justify-between">
                            {addr.title}
                            {addr.isPrimary && <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Principale</span>}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{addr.address}</p>
                        </button>
                      ))}
                      <div className="pt-2 border-t mt-1">
                        <Link to="/account/addresses" className="w-full text-center block p-2 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-lg">
                          Gérer mes adresses
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                  placeholder="Ex: Amine Benali"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="tel" 
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                    placeholder="Ex: 0555000000"
                    value={formData.phone}
                    onChange={e => {
                      const val = e.target.value.replace(/[^\d+]/g, '');
                      setFormData({...formData, phone: val});
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optionnel - pour le suivi)</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                placeholder="Ex: amine@gmail.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
              <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                <span className="flex items-center gap-1">📧 Pour recevoir la confirmation de votre commande</span>
                <span className="flex items-center gap-1">🔒 Données confidentielles</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wilaya *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <select 
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow appearance-none bg-white"
                    value={formData.wilaya}
                    onChange={handleWilayaChange}
                  >
                    <option value="" disabled>Sélectionnez votre wilaya</option>
                    {wilayas.map(w => (
                      <option key={w.number} value={w.number}>{w.number} - {w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commune *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Navigation size={18} className="text-gray-400" />
                  </div>
                  <select 
                    required
                    disabled={!formData.wilaya}
                    className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={formData.commune}
                    onChange={handleCommuneChange}
                  >
                    <option value="" disabled>{!formData.wilaya ? 'D\'abord choisir une wilaya' : 'Sélectionnez votre commune'}</option>
                    {formData.wilaya && ALGERIA_COMMUNES[formData.wilaya]?.map(commune => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode de livraison *</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center justify-center transition-colors ${deliveryMode === 'domicile' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
                  <input type="radio" className="sr-only" name="deliveryMode" value="domicile" checked={deliveryMode === 'domicile'} onChange={(e) => setDeliveryMode(e.target.value as 'domicile')} />
                  <Truck className={`h-6 w-6 mb-2 ${deliveryMode === 'domicile' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${deliveryMode === 'domicile' ? 'text-orange-700' : 'text-gray-700'}`}>À domicile</span>
                </label>
                <label className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center justify-center transition-colors ${deliveryMode === 'bureau' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}>
                  <input type="radio" className="sr-only" name="deliveryMode" value="bureau" checked={deliveryMode === 'bureau'} onChange={(e) => setDeliveryMode(e.target.value as 'bureau')} />
                  <MapPin className={`h-6 w-6 mb-2 ${deliveryMode === 'bureau' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${deliveryMode === 'bureau' ? 'text-orange-700' : 'text-gray-700'}`}>En point relais</span>
                </label>
              </div>
            </div>

            {deliveryMode === 'bureau' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choisir un point relais *</label>
                
                {(() => {
                  const filteredOffices = offices.filter(o => {
                    const matchWilaya = !formData.wilaya || Number(o.wilaya) === Number(formData.wilaya);
                    const matchCommune = !formData.commune || o.commune.toLowerCase() === formData.commune.toLowerCase();
                    return matchWilaya && matchCommune;
                  });

                  if (!formData.wilaya) {
                    return (
                      <div className="p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-200 text-sm">
                        Sélectionnez d'abord une wilaya et une commune pour voir les points relais.
                      </div>
                    );
                  }

                  if (filteredOffices.length === 0) {
                    return (
                      <div className="p-4 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 text-sm flex items-center justify-center min-h-[100px] text-center">
                        Aucun point relais disponible pour la wilaya / commune sélectionnée.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredOffices.map(office => (
                        <label 
                          key={office.id} 
                          className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${String(officeId) === String(office.id) ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              <input 
                                type="radio" 
                                name="selectedOffice" 
                                value={office.id}
                                checked={String(officeId) === String(office.id)}
                                onChange={(e) => setOfficeId(e.target.value)}
                                className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 size={18} className="text-gray-500" />
                                <h4 className="font-bold text-gray-900 uppercase">{office.name}</h4>
                              </div>
                              <div className="space-y-1.5 text-sm text-gray-600 ml-6">
                                <p className="flex items-start gap-2">
                                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span>{office.address} <span className="font-bold text-gray-800">({office.commune})</span></span>
                                </p>
                                {office.phone && (
                                  <p className="flex items-start gap-2">
                                    <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>{office.phone.split(',').map((p: string) => p.trim()).join(' / ')}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  );
                })()}

              </div>
            )}

            {deliveryMode === 'domicile' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète *</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow resize-none"
                  placeholder="Ex: Cité 100 logements, Bâtiment A, Porte 5"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note pour le livreur (Optionnel)</label>
              <textarea 
                rows={2}
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow resize-none"
                placeholder="Ex: Appeler avant d'arriver, ou laisser chez le gardien"
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
              />
            </div>

            {/* Payment Method */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold text-gray-800 mb-4">Mode de paiement</h3>
              <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-4 flex items-center gap-4">
                <div className="bg-white p-2 rounded-full text-orange-500 shadow-sm">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-orange-800">Paiement à la livraison</h4>
                  <p className="text-sm text-orange-600">Payez en espèces lorsque vous recevez votre commande.</p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-4">Résumé de la commande</h2>
            
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {checkoutItems.map(item => (
                <div key={item.cartItemId || item.id} className="flex justify-between text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-500">{item.quantity}x</span>
                    <div className="flex flex-col">
                      <span className="text-gray-800 line-clamp-1">{item.name}</span>
                      {item.selectedVariation && (
                        <span className="text-xs text-gray-500">{item.selectedVariation.attribute}: {item.selectedVariation.value}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-medium whitespace-nowrap">{formatPrice((item.selectedVariation?.price || item.promo_price || item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span className="font-medium">{formatPrice(checkoutTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{deliveryMode === 'domicile' ? 'Frais de livraison' : 'Tarif Point Relais'}</span>
                {isFreeShipping ? (
                  <div className="text-right">
                    <span className="text-xs text-gray-400 line-through mr-2">{formatPrice(deliveryCost)}</span>
                    <span className="font-bold text-green-600">Gratuit</span>
                    <div className="text-[10px] text-green-500 font-medium">Offre automatique (10 000 DA + 3 articles)</div>
                  </div>
                ) : deliveryCost > 0 ? (
                  <div className="text-right">
                    {isShippingDiscountApplied ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 line-through">{formatPrice(deliveryCost)}</span>
                        <span className="font-medium text-green-600">+{formatPrice(effectiveDeliveryCost)}</span>
                      </div>
                    ) : (
                      <span className="font-medium text-orange-500">+{formatPrice(deliveryCost)}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Sélectionnez une wilaya</span>
                )}
              </div>
              {deliveryTime && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded text-center">
                  Délai estimé: {deliveryTime}
                </div>
              )}
            </div>
            
            {/* Discount Offer Block */}
            {!formData.email && !isShippingDiscountApplied && showDiscountOffer && deliveryCost > 0 && shippingSettings.show && (
              <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 shadow-sm animate-fade-in transition-all duration-500">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <h3 className="font-bold text-orange-800 text-sm">Offre spéciale</h3>
                    <p className="text-xs text-orange-700 font-medium mt-0.5">{shippingSettings.message.replace('{percent}', shippingSettings.percent.toString())}</p>
                    <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                      <span>⏳</span> Offre limitée aujourd'hui
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <input 
                    type="email" 
                    placeholder="Entrez votre email pour activer l'offre" 
                    className="w-full px-3 py-2 text-sm rounded border border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    value={discountEmail}
                    onChange={(e) => setDiscountEmail(e.target.value)}
                  />
                  <button 
                    onClick={handleApplyDiscount}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2 px-4 rounded transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>👉</span> Confirmer et appliquer la réduction
                  </button>
                </div>
              </div>
            )}

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-800">Total à payer</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.wilaya || !formData.commune || !formData.name || !formData.phone || (deliveryMode === 'domicile' ? !formData.address : !officeId)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-4 rounded-md flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Confirmer la commande'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
