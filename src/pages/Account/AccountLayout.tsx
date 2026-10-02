import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  LogOut, 
  LayoutDashboard,
  Settings,
  Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SEO from '../../components/SEO';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut: handleSignOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (handleSignOut) {
        await handleSignOut();
      }
      toast.success('Déconnexion réussie');
      navigate('/');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const navItems = [
    { name: 'Tableau de bord', path: '/account/dashboard', icon: LayoutDashboard },
    { name: 'Mes Commandes', path: '/account/orders', icon: Package },
    { name: 'Ma Liste d\'envies', path: '/account/wishlist', icon: Heart },
    { name: 'Mes Adresses', path: '/account/addresses', icon: MapPin },
    { name: 'Mon Profil', path: '/account/profile', icon: User },
    { name: 'Notifications', path: '/account/notifications', icon: Bell },
  ];

  return (
    <>
      <SEO title="Mon Compte - ZORANDO" description="Gérez votre compte ZORANDO." noindex={true} />
      <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-50 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 truncate">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.displayName || 'Client Zorando')}
                </h3>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <nav className="p-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                        isActive 
                        ? 'bg-orange-50 text-orange-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${item.name === 'Mes Commandes' ? 'text-blue-500' : ''}`} />
                    {item.name}
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all mt-4"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Déconnexion
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 min-h-[600px]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  
    </>
  )
}