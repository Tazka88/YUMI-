/**
 * Frontend Service for Ecotrack API
 * 
 * Ce service communique avec notre proxy backend Node.js
 * afin de ne pas exposer le token d'API côté client.
 */

const API_BASE = '/api/ecotrack';

export interface EcotrackCreateOrderPayload {
  reference?: string;
  nom_client: string;
  telephone: string;
  telephone_2?: string;
  adresse: string;
  wilaya: number; // 1 to 58
  commune: string;
  montant: number;
  remarque?: string;
  produit?: string;
  type: number; // 1 to 4
  stop_desk: 0 | 1;
  poids?: number;
  id_produit?: string;
  [key: string]: any;
}

export const ecotrackService = {
  /**
   * Helper unifié pour les appels fetch
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || response.statusText;
          if (errorData.details) {
            errorDetails += ` : ${JSON.stringify(errorData.details)}`;
          }
        } catch(e) {
          errorDetails = response.statusText;
        }
        
        let message = `Erreur HTTP: ${response.status} - ${errorDetails}`;
        if (response.status === 400 || response.status === 422) message = `Validation: ${errorDetails}`;
        if (response.status === 401) message = `Authentification Ecotrack refusée`;
        if (response.status === 429) message = `Trop de requêtes, veuillez patienter.`;
        if (response.status >= 500) message = `Service de livraison momentanément indisponible.`;

        throw new Error(message);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Erreur EcotrackService [${endpoint}]:`, error);
      throw error;
    }
  },

  /**
   * GET /api/ecotrack/get-fees
   */
  getFees() {
    return this.request('/get-fees');
  },

  /**
   * GET /api/ecotrack/get-products
   */
  getProducts() {
    return this.request('/get-products');
  },

  /**
   * GET /api/ecotrack/wilayas
   */
  getWilayas() {
    return this.request('/wilayas');
  },

  /**
   * GET /api/ecotrack/communes
   */
  getCommunes(wilayaId?: number) {
    const query = wilayaId ? `?wilaya=${wilayaId}` : '';
    return this.request(`/communes${query}`);
  },

  /**
   * GET /api/ecotrack/orders
   */
  getOrders(params?: Record<string, any>) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/orders?${query}`);
  },

  /**
   * GET /api/ecotrack/tracking
   */
  getTracking(trackingCode: string) {
    return this.request(`/tracking?tracking=${trackingCode}`);
  },

  /**
   * GET /api/ecotrack/label
   */
  getLabel(trackingCode: string) {
    return this.request(`/label?tracking=${trackingCode}`);
  },

  /**
   * DELETE /api/ecotrack/order
   */
  deleteOrder(trackingCode: string) {
    return this.request('/order', {
      method: 'DELETE',
      body: JSON.stringify({ tracking: trackingCode })
    });
  },

  /**
   * POST /api/ecotrack/create-order
   */
  createOrder(payload: EcotrackCreateOrderPayload) {
    return this.request('/create-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * POST /api/ecotrack/create-orders (Batch)
   */
  createOrdersBatch(payloads: EcotrackCreateOrderPayload[]) {
    return this.request('/create-orders', {
      method: 'POST',
      body: JSON.stringify(payloads)
    });
  },

  /**
   * POST /api/ecotrack/update/order
   */
  updateOrder(payload: any) {
    return this.request('/update/order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * POST /api/ecotrack/valid/order
   */
  validOrder(payload: any) {
    return this.request('/valid/order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
