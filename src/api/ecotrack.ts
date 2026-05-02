import { Router } from 'express';
import axios from 'axios';

const router = Router();

// L'URL et le Token doivent rester uniquement côté serveur
// Ils peuvent être configurés via des variables d'environnement
const URL_API = process.env.ECOTRACK_API_URL || '[COLLE ICI TON URL]';
const TOKEN = process.env.ECOTRACK_TOKEN || '[COLLE ICI TON TOKEN]';

// Configuration Axios pour Ecotrack
const ecotrackApi = axios.create({
  baseURL: URL_API,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

/**
 * Route: GET /get-fees
 * Récupère les tarifs de livraison depuis Ecotrack
 */
router.get('/get-fees', async (req, res) => {
  try {
    const response = await ecotrackApi.get('/api/v1/get/fees');
    res.json(response.data);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des tarifs Ecotrack:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Erreur lors de la communication avec l'API Ecotrack",
      details: error.response?.data || error.message
    });
  }
});

/**
 * Route: GET /get-products
 * Récupère la liste des produits depuis Ecotrack
 */
router.get('/get-products', async (req, res) => {
  try {
    const response = await ecotrackApi.get('/api/v1/get/products/list');
    res.json(response.data);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des produits Ecotrack:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: "Erreur lors de la communication avec l'API Ecotrack",
      details: error.response?.data || error.message
    });
  }
});

export default router;
