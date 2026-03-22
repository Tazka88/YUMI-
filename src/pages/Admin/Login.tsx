import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Identifiants invalides');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-500 rounded-full mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Espace Administrateur</h1>
          <p className="text-gray-500 text-sm mt-2">Connectez-vous pour gérer votre boutique Yumi</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input 
                type="password" 
                required
                className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-md disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
          Identifiants par défaut: admin / admin123
        </div>
      </div>
    </div>
  );
}
