import { create } from 'zustand';

interface CommunesState {
  communes: Record<string, string[]>;
  loading: boolean;
  fetched: boolean;
  fetchCommunes: () => Promise<void>;
}

export const useCommunesStore = create<CommunesState>((set, get) => ({
  communes: {},
  loading: false,
  fetched: false,
  fetchCommunes: async () => {
    if (get().fetched || get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch('/api/communes/public');
      if (res.ok) {
        const data = await res.json();
        set({ communes: data, loading: false, fetched: true });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ loading: false });
    }
  }
}));
