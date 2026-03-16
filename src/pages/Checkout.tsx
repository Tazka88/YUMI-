import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { CheckCircle, Truck, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';
import ReactGA from 'react-ga4';
import ReactPixel from 'react-facebook-pixel';

// Mock Wilayas data with delivery costs
const WILAYAS = [
  { id: '01', name: 'Adrar', cost: 1200, time: '3-5 jours' },
  { id: '02', name: 'Chlef', cost: 600, time: '24h-48h' },
  { id: '03', name: 'Laghouat', cost: 800, time: '48h-72h' },
  { id: '04', name: 'Oum El Bouaghi', cost: 800, time: '48h-72h' },
  { id: '05', name: 'Batna', cost: 800, time: '48h-72h' },
  { id: '06', name: 'Béjaïa', cost: 600, time: '24h-48h' },
  { id: '07', name: 'Biskra', cost: 800, time: '48h-72h' },
  { id: '08', name: 'Béchar', cost: 1000, time: '3-5 jours' },
  { id: '09', name: 'Blida', cost: 400, time: '24h' },
  { id: '10', name: 'Bouira', cost: 500, time: '24h-48h' },
  { id: '11', name: 'Tamanrasset', cost: 1500, time: '5-7 jours' },
  { id: '12', name: 'Tébessa', cost: 800, time: '48h-72h' },
  { id: '13', name: 'Tlemcen', cost: 800, time: '48h-72h' },
  { id: '14', name: 'Tiaret', cost: 800, time: '48h-72h' },
  { id: '15', name: 'Tizi Ouzou', cost: 500, time: '24h-48h' },
  { id: '16', name: 'Alger', cost: 400, time: '24h' },
  { id: '17', name: 'Djelfa', cost: 800, time: '48h-72h' },
  { id: '18', name: 'Jijel', cost: 600, time: '48h-72h' },
  { id: '19', name: 'Sétif', cost: 600, time: '24h-48h' },
  { id: '20', name: 'Saïda', cost: 800, time: '48h-72h' },
  { id: '21', name: 'Skikda', cost: 800, time: '48h-72h' },
  { id: '22', name: 'Sidi Bel Abbès', cost: 800, time: '48h-72h' },
  { id: '23', name: 'Annaba', cost: 800, time: '48h-72h' },
  { id: '24', name: 'Guelma', cost: 800, time: '48h-72h' },
  { id: '25', name: 'Constantine', cost: 800, time: '48h-72h' },
  { id: '26', name: 'Médéa', cost: 500, time: '24h-48h' },
  { id: '27', name: 'Mostaganem', cost: 800, time: '48h-72h' },
  { id: '28', name: "M'Sila", cost: 800, time: '48h-72h' },
  { id: '29', name: 'Mascara', cost: 800, time: '48h-72h' },
  { id: '30', name: 'Ouargla', cost: 1200, time: '3-5 jours' },
  { id: '31', name: 'Oran', cost: 800, time: '48h-72h' },
  { id: '32', name: 'El Bayadh', cost: 1000, time: '3-5 jours' },
  { id: '33', name: 'Illizi', cost: 1500, time: '5-7 jours' },
  { id: '34', name: 'Bordj Bou Arreridj', cost: 600, time: '24h-48h' },
  { id: '35', name: 'Boumerdès', cost: 400, time: '24h' },
  { id: '36', name: 'El Tarf', cost: 800, time: '48h-72h' },
  { id: '37', name: 'Tindouf', cost: 1500, time: '5-7 jours' },
  { id: '38', name: 'Tissemsilt', cost: 800, time: '48h-72h' },
  { id: '39', name: 'El Oued', cost: 1200, time: '3-5 jours' },
  { id: '40', name: 'Khenchela', cost: 800, time: '48h-72h' },
  { id: '41', name: 'Souk Ahras', cost: 800, time: '48h-72h' },
  { id: '42', name: 'Tipaza', cost: 400, time: '24h' },
  { id: '43', name: 'Mila', cost: 800, time: '48h-72h' },
  { id: '44', name: 'Aïn Defla', cost: 500, time: '24h-48h' },
  { id: '45', name: 'Naâma', cost: 1000, time: '3-5 jours' },
  { id: '46', name: 'Aïn Témouchent', cost: 800, time: '48h-72h' },
  { id: '47', name: 'Ghardaïa', cost: 1000, time: '3-5 jours' },
  { id: '48', name: 'Relizane', cost: 800, time: '48h-72h' },
  { id: '49', name: 'Timimoun', cost: 1200, time: '3-5 jours' },
  { id: '50', name: 'Bordj Badji Mokhtar', cost: 1500, time: '5-7 jours' },
  { id: '51', name: 'Ouled Djellal', cost: 1000, time: '3-5 jours' },
  { id: '52', name: 'Béni Abbès', cost: 1200, time: '3-5 jours' },
  { id: '53', name: 'In Salah', cost: 1500, time: '5-7 jours' },
  { id: '54', name: 'In Guezzam', cost: 1500, time: '5-7 jours' },
  { id: '55', name: 'Touggourt', cost: 1200, time: '3-5 jours' },
  { id: '56', name: 'Djanet', cost: 1500, time: '5-7 jours' },
  { id: '57', name: "El M'Ghair", cost: 1200, time: '3-5 jours' },
  { id: '58', name: 'El Meniaa', cost: 1200, time: '3-5 jours' }
];

export default function Checkout() {
  const { items, total, clearCart } = useCartStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wilaya: '',
    address: '',
    note: ''
  });
  
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [trackingIds, setTrackingIds] = useState({ ga: '', fb: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setTrackingIds({
          ga: data.ga_measurement_id || import.meta.env.VITE_GA_MEASUREMENT_ID || '',
          fb: data.fb_pixel_id || import.meta.env.VITE_FB_PIXEL_ID || ''
        });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [items, navigate, orderSuccess]);

  const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wilayaId = e.target.value;
    setFormData({ ...formData, wilaya: wilayaId });
    
    const selectedWilaya = WILAYAS.find(w => w.id === wilayaId);
    if (selectedWilaya) {
      setDeliveryCost(selectedWilaya.cost);
      setDeliveryTime(selectedWilaya.time);
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
      customer_phone: formData.phone,
      wilaya: WILAYAS.find(w => w.id === formData.wilaya)?.name || formData.wilaya,
      address: formData.address,
      note: formData.note,
      total_amount: total() + deliveryCost,
      delivery_cost: deliveryCost,
      items: items.map(item => ({
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
        setOrderSuccess(true);
        clearCart();
        
        // Track Purchase
        const finalTotal = total() + deliveryCost;
        if (trackingIds.ga) {
          ReactGA.event("purchase", {
            transaction_id: Date.now().toString(),
            value: finalTotal,
            currency: "DZD",
            shipping: deliveryCost,
            items: items.map(item => ({
              item_id: item.id.toString(),
              item_name: item.name,
              price: item.promo_price || item.price,
              quantity: item.quantity
            }))
          });
        }
        
        if (trackingIds.fb) {
          ReactPixel.track('Purchase', {
            value: finalTotal,
            currency: 'DZD',
            content_ids: items.map(item => item.id.toString()),
            content_type: 'product'
          });
        }

        // Mock notification
        console.log(`Notification envoyée à ${formData.phone} via WhatsApp`);
      } else {
        throw new Error('Erreur lors de la commande');
      }
    } catch (error) {
      alert('Une erreur est survenue. Veuillez réessayer.');
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
                  {WILAYAS.map(w => (
                    <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
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
              {items.map(item => (
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
                <span className="font-medium">{formatPrice(total())}</span>
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
                  <span className="text-2xl font-black text-orange-600">{formatPrice(total() + deliveryCost)}</span>
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
