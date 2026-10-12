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
      if (status === 401 || status === 403 || status === 404) {
        console.warn(`[Ecom-DZ] API non autorisée ou ressource introuvable (${status})`);
        return res.status(status).json({ 
          error: 'Authentification Ecom-DZ non autorisée ou service non disponible',
          status 
        });
      } else if (status === 429) {
        console.warn('[Ecom-DZ] Trop de requêtes (429)');
        return res.status(429).json({ error: 'Trop de requêtes vers Ecom-DZ, veuillez patienter' });
      }
      
      console.warn(`[Ecom-DZ] Réponse API ${status}`);
      return res.status(status).json({ 
        error: 'Erreur lors de la communication avec Ecom-DZ', 
        details: typeof error.response.data === 'string' ? error.response.data : 'Erreur API Ecom-DZ'
      });
    } else if (error.request) {
      console.warn('[Ecom-DZ] Pas de réponse du serveur distant');
      return res.status(503).json({ error: 'Service de livraison (Ecom-DZ) temporairement indisponible' });
    } else {
      console.warn('[Ecom-DZ] Erreur requête:', error.message);
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
  if (!KEY || !TOKEN) {
    return null;
  }
  try {
    const response = await ecomdzApi.get('/Stopdesk');
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 401 || err?.response?.status === 403) {
      // Clé ou token non autorisés ou endpoint indisponible sur Ecom-DZ
      console.warn(`[Ecom-DZ] Récupération stopdesks ignorée (${err.response?.status})`);
    } else {
      console.warn('[Ecom-DZ] Erreur réseau lors de la récupération des stopdesks:', err?.message || 'Erreur inconnue');
    }
    return null;
  }
};
