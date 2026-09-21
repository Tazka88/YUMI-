import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import { deleteUserAccount } from '../services/api';
import { setupPushNotifications } from '../services/pushNotifications';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata: { firstName: string; lastName: string; phone?: string; wilaya?: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  token: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  deleteAccount: async () => ({ success: false }),
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.warn('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    // Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setToken(session.access_token);
        fetchProfile(session.user.id);
        setupPushNotifications(session.user.id);
      } else {
        setupPushNotifications();
      }
      setIsLoading(false);
    });

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setToken(session.access_token);
          fetchProfile(session.user.id);
          setupPushNotifications(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setToken(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata: { firstName: string; lastName: string; phone?: string; wilaya?: string }
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          first_name: metadata.firstName,
          last_name: metadata.lastName,
          phone: metadata.phone,
          wilaya: metadata.wilaya,
        },
      },
    });

    if (!error && data.user) {
      // Créer ou mettre à jour la table profiles
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: cleanEmail,
        first_name: metadata.firstName,
        last_name: metadata.lastName,
        phone: metadata.phone || null,
        wilaya: metadata.wilaya || null,
        updated_at: new Date().toISOString(),
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setToken(null);
  };

  const deleteAccount = async () => {
    if (!token) return { success: false, error: 'Non authentifié' };
    try {
      await deleteUserAccount(token);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setToken(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la suppression' };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        signIn,
        signUp,
        signOut,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
