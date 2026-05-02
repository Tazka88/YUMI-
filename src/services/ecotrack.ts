/**
 * Frontend Service for Ecotrack API
 * 
 * Ce service communique avec notre proxy backend Node.js
 * afin de ne pas exposer le token d'API côté client.
 */

const API_BASE = '/api/ecotrack';

export interface EcotrackFeesResponse {
  // Définir la structure selon la réponse d'Ecotrack
  [key: string]: any;
}

export interface EcotrackProductsResponse {
  // Définir la structure selon la réponse d'Ecotrack
  [key: string]: any;
}

export const ecotrackService = {
  /**
   * Récupère les tarifs (livraison, pickup, etc.)
   */
  async getFees(): Promise<EcotrackFeesResponse> {
    try {
      const response = await fetch(`${API_BASE}/get-fees`);
      
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.details || response.statusText;
        } catch(e) {
          errorDetails = response.statusText;
        }
        throw new Error(`Erreur HTTP: ${response.status} - ${errorDetails}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur ecotrackService.getFees:', error);
      throw error;
    }
  },

  /**
   * Récupère la liste des produits
   */
  async getProducts(): Promise<EcotrackProductsResponse> {
    try {
      const response = await fetch(`${API_BASE}/get-products`);
      
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.details || response.statusText;
        } catch(e) {
          errorDetails = response.statusText;
        }
        throw new Error(`Erreur HTTP: ${response.status} - ${errorDetails}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur ecotrackService.getProducts:', error);
      throw error;
    }
  }
};
