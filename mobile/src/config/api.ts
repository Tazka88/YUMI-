import Constants from 'expo-constants';

// En production, pointe directement sur le backend en ligne ZORANDO.
// En local avec Expo, on peut surcharger via extra ou variable d'environnement.
export const API_BASE_URL = 
  Constants.expoConfig?.extra?.apiUrl || 
  'https://www.zorando.com/api';

export const SUPABASE_URL = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  'https://evvbhalgyffagsesmvhu.supabase.co';

export const SUPABASE_ANON_KEY = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmJoYWxneWZmYWdzZXNtdmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MjgwODMsImV4cCI6MjA1NDAwNDA4M30.default';

export const IMAGE_BASE_URL = 'https://www.zorando.com';
