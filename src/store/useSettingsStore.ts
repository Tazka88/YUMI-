import { create } from 'zustand';
import { fetchWithCache } from '../lib/utils';

type StoreSettings = Record<string, any>;

interface SettingsState {
  settings: StoreSettings;
  loading: boolean;
  fetched: boolean;
  fetchSettings: () => Promise<StoreSettings>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loading: false,
  fetched: false,
  fetchSettings: async () => {
    if (get().fetched) {
      return get().settings;
    }
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
      set({ settings: settings || {}, loading: false, fetched: true });
      return settings || {};
    } catch (error) {
      console.error('Failed to fetch settings global store:', error);
      set({ loading: false });
      return {};
    }
  }
}));
