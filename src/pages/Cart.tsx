import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../utils/formatPrice';

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="bg-orange-100 p-6 rounded-full text-orange-500 mb-6">
          <ShoppingBag size={64} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Votre panier est vide</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Parcourez nos catégories et découvrez nos meilleures offres pour remplir votre panier.
        </p>
        <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-md">
          Commencer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Mon Panier ({items.length} articles)</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3 space-y-4">
          {items.map((item) => {
            const currentPrice = item.promo_price || item.price;
            return (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 relative">
                <Link to={`/product/${item.slug}`} className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-gray-50">
                  <img 
                    src={item.image || `https://picsum.photos/seed/${item.slug}/200/200`} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </Link>
                
                <div className="flex-1">
                  <Link to={`/product/${item.slug}`} className="font-medium text-gray-800 hover:text-orange-500 line-clamp-2 mb-1">
                    {item.name}
                  </Link>
                  <div className="text-sm text-gray-500 mb-2">Vendeur: Yumi Express</div>
                  <div className="text-lg font-bold text-orange-600">{formatPrice(currentPrice)}</div>
                </div>

                <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center border border-gray-300 rounded-md bg-white">
                    <button 
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                    >-</button>
                    <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                    <button 
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                      disabled={item.quantity >= item.stock}
                    >+</button>
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-4">Résumé de la commande</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total ({items.reduce((acc, item) => acc + item.quantity, 0)} articles)</span>
                <span className="font-medium">{formatPrice(total())}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                <span className="text-sm text-orange-500">Calculés à l'étape suivante</span>
              </div>
            </div>
            
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-800">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600">{formatPrice(total())}</span>
                  <div className="text-xs text-gray-500">TVA incluse</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              Passer la commande
              <ArrowRight size={20} />
            </button>
            
            <div className="mt-4 text-xs text-center text-gray-500">
              Paiement 100% sécurisé à la livraison.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
