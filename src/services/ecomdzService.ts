/**
 * Frontend Service for Ecom-DZ Delivery API (Proxy)
 */

const API_BASE = '/api/ecomdz';

export interface EcomDzCreateOrderPayload {
  Colis: {
    Echange: number;
    Stopdesk: number;
    CodeStopdesk?: string;
    NomComplet: string;
    Mobile_1: string;
    Mobile_2?: string;
    Adresse: string;
    Wilaya: string;
    Commune: string;
    Article: string;
    Ref_Article?: string;
    NoteFournisseur?: string;
    Total: number;
    ID_Externe?: string;
    Source?: string;
  }[];
}

export const ecomdzService = {
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
        let message = data.error || 'Erreur API Livraison Ecom-DZ';
        if (response.status === 401 || response.status === 403) message = `Authentification Ecom-DZ refusée`;
        throw new Error(message);
      }

      return data;
    } catch (error: any) {
      console.error(`Erreur EcomdzService [${endpoint}]:`, error);
      throw error;
    }
  },

  /**
   * GET /api/ecomdz/test
   */
  testConnection() {
    return this.fetchWithAuth('/test');
  },

  /**
   * GET /api/ecomdz/communes
   */
  getCommunes() {
    return this.fetchWithAuth('/communes');
  },

  /**
   * GET /api/ecomdz/communes/:idWilaya
   */
  getCommunesByWilaya(idWilaya: number | string) {
    return this.fetchWithAuth(`/communes/${idWilaya}`);
  },
  
  /**
   * GET /api/ecomdz/stopdesk
   */
  getStopdesk() {
    return this.fetchWithAuth('/stopdesk');
  },
  
  /**
   * GET /api/ecomdz/stopdesk/:idWilaya
   */
  getStopdeskByWilaya(idWilaya: number | string) {
    return this.fetchWithAuth(`/stopdesk/${idWilaya}`);
  },

  /**
   * POST /api/ecomdz/create-orders
   */
  createOrders(payload: EcomDzCreateOrderPayload) {
    return this.fetchWithAuth('/create-orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
