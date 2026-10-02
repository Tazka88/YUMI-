import { create } from 'zustand';
import { fetchWithCache } from '../lib/utils';

type StoreSettings = Record<string, any>;

interface SettingsState {
  settings: StoreSettings;
  loading: boolean;
  fetched: boolean;
  fetchSettings: () => Promise<StoreSettings>;
  setSettings: (settings: StoreSettings) => void;
}

const getCachedSettings = (): StoreSettings => {
  try {
    const cached = localStorage.getItem('zorando_settings_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {}
  return {};
};

const initialSettings = getCachedSettings();
const hasCached = Object.keys(initialSettings).length > 0;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: initialSettings,
  loading: false,
  fetched: hasCached,
  setSettings: (newSettings: StoreSettings) => {
    try {
      localStorage.setItem('zorando_settings_cache', JSON.stringify(newSettings));
    } catch (e) {}
    set({ settings: newSettings, fetched: true });
  },
  fetchSettings: async () => {
    if (get().loading) {
      // Wait for the existing request...
      return new Promise<StoreSettings>((resolve) => {
        const check = setInterval(() => {
          if (!get().loading) {
            clearInterval(check);
            resolve(get().settings);
          }
        }, 50);
      });
    }

    set({ loading: true });
    try {
      const settings = await fetchWithCache('/api/settings', { maxAge: 300000 }); // Cache 5 min
      const finalSettings = settings || {};
      try {
        localStorage.setItem('zorando_settings_cache', JSON.stringify(finalSettings));
      } catch (e) {}
      set({ settings: finalSettings, loading: false, fetched: true });
      return finalSettings;
    } catch (error) {
      console.error('Failed to fetch settings global store:', error);
      set({ loading: false });
      return get().settings;
    }
  }
}));

