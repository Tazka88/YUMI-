import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const supabase = getSupabase();

  useEffect(() => {
    if (!supabase) return;

    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error in auth callback:', error);
        navigate('/account/login');
      } else if (data.session) {
        navigate('/account/dashboard');
      } else {
        // Fallback if no session found yet
        console.log('No session found in callback, waiting...');
        setTimeout(() => navigate('/account/dashboard'), 1500);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-bold text-gray-900">Finalisation de la connexion...</h2>
      <p className="text-gray-500 mt-2">Veuillez patienter quelques instants.</p>
    </div>
  );
}
