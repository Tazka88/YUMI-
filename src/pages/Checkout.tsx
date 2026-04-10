import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { CheckCircle, Truck, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import { fetchWithCache } from '../lib/utils';
import { sendCapiEvent, generateEventId } from '../lib/capi';

interface Wilaya {
  id: number;
  number: string;
  name: string;
  delivery_cost: number;
  is_active: number;
}

export default function Checkout() {
  const { items, total, clearCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const directBuyItem = location.state?.directBuyItem;
  const checkoutItems = directBuyItem ? [directBuyItem] : items;
  const checkoutTotal = directBuyItem ? (directBuyItem.promo_price || directBuyItem.price) * directBuyItem.quantity : total();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    wilaya: '',
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

  useEffect(() => {
    const fetchWilayas = async () => {
      try {
        const data = await fetchWithCache('/api/wilayas');
        if (Array.isArray(data)) {
          setWilayas(data.filter((w: any) => w.is_active === true || w.is_active === 1));
        }
      } catch (error) {
        console.error('Failed to fetch wilayas:', error);
      }
    };
    fetchWilayas();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchWithCache('/api/settings', { signal: controller.signal })
      .then(data => {
        setTrackingIds({
          ga: (data as any).ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID || '',
          fb: (data as any).fb_pixel_id || import.meta.env.VITE_FB_PIXEL_ID || ''
        });
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, []);

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

  const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wilayaNumber = e.target.value;
    setFormData({ ...formData, wilaya: wilayaNumber });
    
    const selectedWilaya = wilayas.find(w => w.number === wilayaNumber);
    if (selectedWilaya) {
      setDeliveryCost(Number(selectedWilaya.delivery_cost));
      setDeliveryTime('24h-72h'); // Default time or could be added to DB
    } else {
      setDeliveryCost(0);
      setDeliveryTime('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderData = {
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      wilaya: wilayas.find(w => w.number === formData.wilaya)?.name || formData.wilaya,
      address: formData.address,
      note: formData.note,
      total_amount: checkoutTotal + deliveryCost,
      delivery_cost: deliveryCost,
      items: checkoutItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.promo_price || item.price
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
            const eventId = generateEventId();
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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Commande Confirmée !</h1>
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
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Finaliser la commande</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form */}
        <div className="w-full lg:w-2/3">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
              <UserIcon size={20} className="text-orange-500" />
              Informations de livraison
            </h2>

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
                    pattern="[0-9]{10}"
                    className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                    placeholder="Ex: 0555000000"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
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
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-500">{item.quantity}x</span>
                    <span className="text-gray-800 line-clamp-1">{item.name}</span>
                  </div>
                  <span className="font-medium whitespace-nowrap">{formatPrice((item.promo_price || item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span className="font-medium">{formatPrice(checkoutTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                {deliveryCost > 0 ? (
                  <span className="font-medium text-orange-500">+{formatPrice(deliveryCost)}</span>
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
            
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-800">Total à payer</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600">{formatPrice(checkoutTotal + deliveryCost)}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.wilaya || !formData.name || !formData.phone || !formData.address}
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
