import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const PromoPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Ne pas afficher si l'utilisateur est déjà connecté
    if (loading || user) return;

    const hasSeenPopup = localStorage.getItem('hasSeenPromoPopup');
    
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // Apparition après 5 secondes

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenPromoPopup', 'true');
  };

  const handleSignup = () => {
    handleClose();
    // Rediriger vers la page de profil / connexion
    navigate('/account/register');
  };

  if (!isOpen) return null;

  return (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full relative animate-fade-in-up"
            onClick={(e) => e.stopPropagation()} // Empêche la fermeture lors du clic à l'intérieur
          >
            {/* Bouton de fermeture */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full z-10"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center sm:p-10 font-sans">
              <span className="inline-block text-5xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>👋</span>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Hey
              </h3>
              
              <div className="text-gray-600 mb-8 space-y-3 text-lg leading-relaxed">
                <p>On a un petit cadeau pour vous 🎁</p>
                <p className="font-bold text-xl text-red-600">
                  -10% sur votre première commande
                </p>
                <p>si vous vous inscrivez !</p>
                <p className="text-sm text-gray-500 italic mt-2">Ça prend 10 secondes 😉</p>
              </div>
              
              {/* Bouton principal avec animation au hover */}
              <button
                onClick={handleSignup}
                className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(220,38,38,0.39)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.23)] hover:bg-red-700 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Je m'inscris et j'économise</span>
              </button>
            </div>
          </div>
        </div>
  );
};

export default PromoPopup;
