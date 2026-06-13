import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  let supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
  if (supabaseUrl.includes('https://')) {
    supabaseUrl = 'https://' + supabaseUrl.split('https://')[1].trim();
  } else if (supabaseUrl.includes('http://')) {
    supabaseUrl = 'http://' + supabaseUrl.split('http://')[1].trim();
  }

  const supabaseKey = (typeof process !== 'undefined' && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.SUPABASE_ANON_KEY)) 
    || (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return supabaseInstance;
};
