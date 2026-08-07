import express from 'express';
import axios from 'axios';

const router = express.Router();

const URL_API = process.env.ECOMDZ_API_URL || 'https://ecom-dz.net/Api_v1';
const KEY = process.env.ECOMDZ_KEY || '';
const TOKEN = process.env.ECOMDZ_TOKEN || '';

if (!KEY || !TOKEN) {
  console.warn("⚠️ ATTENTION : ECOMDZ_KEY et/ou ECOMDZ_TOKEN sont manquants dans les variables d'environnement.");
}

// Configuration Axios pour Ecom-DZ
const ecomdzApi = axios.create({
  baseURL: URL_API,
  timeout: 5000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Key': KEY,
    'Token': TOKEN,
  }
});

// Wrapper pour simplifier la gestion des erreurs
const handleEcomdzRequest = async (res: any, requestFn: () => Promise<any>) => {
  try {
    const response = await requestFn();
    return res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        console.error('Ecom-DZ API Error 401/403: Authentification invalide');
        return res.status(status).json({ error: 'Authentification Ecom-DZ échouée' });
      } else if (status === 429) {
        console.error('Ecom-DZ API Error 429: Too Many Requests');
        return res.status(429).json({ error: 'Trop de requêtes vers Ecom-DZ, veuillez patienter' });
      }
      
      console.error(`Ecom-DZ API Error ${status}: `, error.response.data);
      return res.status(status).json({ 
        error: 'Erreur lors de la communication avec Ecom-DZ', 
        details: error.response.data 
      });
    } else if (error.request) {
      console.error('Ecom-DZ API Error: Pas de réponse du serveur', error.message);
      return res.status(503).json({ error: 'Service de livraison (Ecom-DZ) temporairement indisponible' });
    } else {
      console.error('Ecom-DZ API Error:', error.message);
      return res.status(500).json({ 
        error: 'Erreur interne lors de la communication avec Ecom-DZ',
        details: error.message 
      });
    }
  }
};

// Endpoints Ecom-DZ
router.get('/test', (req, res) => handleEcomdzRequest(res, () => ecomdzApi.get('/Test')));
router.get('/communes', (req, res) => handleEcomdzRequest(res, () => ecomdzApi.get('/Commune')));
router.get('/communes/:idWilaya', (req, res) => handleEcomdzRequest(res, () => ecomdzApi.get(`/Commune/${req.params.idWilaya}`)));
router.get('/stopdesk', (req, res) => handleEcomdzRequest(res, () => ecomdzApi.get('/Stopdesk')));
router.get('/stopdesk/:idWilaya', (req, res) => handleEcomdzRequest(res, () => ecomdzApi.get(`/Stopdesk/${req.params.idWilaya}`)));

router.post('/create-orders', (req, res) => {
  return handleEcomdzRequest(res, () => ecomdzApi.post('/Colis', req.body));
});

export default router;

export const fetchEcomdzStopdesks = async () => {
  try {
    const response = await ecomdzApi.get('/Stopdesk');
    return response.data;
  } catch (err) {
    console.error('Error fetching EcomDZ stopdesks internally:', err);
    return null;
  }
};
