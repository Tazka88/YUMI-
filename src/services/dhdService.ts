/**
 * Frontend Service for DHD Delivery API (Proxy)
 */

const API_BASE = '/api/delivery';

export interface DhdCreateOrderPayload {
  reference: string;
  nom_client: string;
  telephone: string;
  adresse: string;
  code_wilaya: number;
  wilaya: number;
  commune: string;
  montant: number;
  remarque?: string;
  produit: string;
  type: number; // 1 for delivery
  stop_desk: number; // 0 or 1
  office_id?: number;
}

export const dhdService = {
  async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        let message = data.error || 'Erreur API Livraison';
        if (response.status === 401) message = `Authentification DHD refusée`;
        throw new Error(message);
      }

      return data;
    } catch (error: any) {
      console.error(`Erreur DhdService [${endpoint}]:`, error);
      throw error;
    }
  },

  /**
   * GET /api/delivery/wilayas
   */
  getWilayas() {
    return this.fetchWithAuth('/wilayas');
  },

  /**
   * GET /api/delivery/communes
   */
  getCommunes(wilayaId: number) {
    return this.fetchWithAuth(`/communes?wilaya_id=${wilayaId}`);
  },

  /**
   * POST /api/delivery/create-order
   */
  createOrder(payload: DhdCreateOrderPayload) {
    return this.fetchWithAuth('/create-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
