import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://evvbhalgyffagsesmvhu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmJoYWxneWZmYWdzZXNtdmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Nzc2MDMsImV4cCI6MjA4OTQ1MzYwM30.gL5FtiWtgIDLWXQJZnWbaOK9XY4voUQrfFLf5EaA2v4';

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  let supabaseUrl = '';
  let supabaseKey = '';

  // 1. Check meta tags in DOM (injected by SSR HTML)
  if (typeof document !== 'undefined') {
    const metaUrl = document.querySelector('meta[name="supabase-url"]')?.getAttribute('content');
    const metaKey = document.querySelector('meta[name="supabase-key"]')?.getAttribute('content');
    if (metaUrl && !metaUrl.includes('%VITE_')) supabaseUrl = metaUrl;
    if (metaKey && !metaKey.includes('%VITE_')) supabaseKey = metaKey;
  }

  // 2. Check window globals
  if (typeof window !== 'undefined') {
    if (!supabaseUrl && (window as any).__SUPABASE_URL__) supabaseUrl = (window as any).__SUPABASE_URL__;
    if (!supabaseKey && (window as any).__SUPABASE_KEY__) supabaseKey = (window as any).__SUPABASE_KEY__;
  }

  const isInvalidUrl = (u?: string) => {
    if (!u || typeof u !== 'string') return true;
    const trimmed = u.trim();
    return (
      !trimmed ||
      trimmed === 'undefined' ||
      trimmed === 'null' ||
      trimmed.includes('YOUR_PROJECT_ID') ||
      trimmed.includes('your-project') ||
      trimmed.includes('%VITE_')
    );
  };

  const isInvalidKey = (k?: string) => {
    if (!k || typeof k !== 'string') return true;
    const trimmed = k.trim();
    return (
      !trimmed ||
      trimmed === 'undefined' ||
      trimmed === 'null' ||
      trimmed.includes('%VITE_') ||
      trimmed.toLowerCase().includes('your-service-role') ||
      trimmed.toLowerCase().includes('your-anon-key') ||
      trimmed.includes('YOUR_') ||
      trimmed.startsWith('sb_secret_')
    );
  };

  // 3. Check environment variables (pick first non-placeholder candidate)
  if (isInvalidUrl(supabaseUrl)) {
    const urlCandidates = [
      typeof process !== 'undefined' ? process.env?.SUPABASE_URL : undefined,
      typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined,
      import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined,
    ];
    supabaseUrl = urlCandidates.find((c) => !isInvalidUrl(c)) || '';
  }

  if (isInvalidKey(supabaseKey)) {
    const keyCandidates = [
      typeof process !== 'undefined' ? process.env?.SUPABASE_SERVICE_ROLE_KEY : undefined,
      typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : undefined,
      typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined,
      import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined,
    ];
    supabaseKey = keyCandidates.find((c) => !isInvalidKey(c)) || '';
  }

  // 4. Default fallback to production project if placeholders or empty
  if (isInvalidUrl(supabaseUrl)) {
    supabaseUrl = DEFAULT_SUPABASE_URL;
  }
  if (isInvalidKey(supabaseKey)) {
    supabaseKey = DEFAULT_SUPABASE_ANON_KEY;
  }

  if (supabaseUrl.includes('https://')) {
    supabaseUrl = 'https://' + supabaseUrl.split('https://')[1].trim();
  } else if (supabaseUrl.includes('http://')) {
    supabaseUrl = 'http://' + supabaseUrl.split('http://')[1].trim();
  }

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
