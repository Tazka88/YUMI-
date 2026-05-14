import express from 'express';
import axios from 'axios';

const router = express.Router();

const URL_API = process.env.DHD_API_URL || 'https://platform.dhd-dz.com';
const TOKEN = process.env.DHD_TOKEN || '';

// Configuration Axios pour DHD
const dhdApi = axios.create({
  baseURL: URL_API,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour ajouter le token
dhdApi.interceptors.request.use(config => {
  if (!TOKEN) {
    throw new Error('DHD_CONFIG_MISSING');
  }
  config.headers.Authorization = `Bearer ${TOKEN}`;
  return config;
});

// Wrapper pour simplifier la gestion des erreurs
const handleDhdRequest = async (res: any, requestFn: () => Promise<any>) => {
  try {
    const response = await requestFn();
    return res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.error('DHD API Error 401: Token invalide ou expiré');
        return res.status(401).json({ error: 'Authentification DHD échouée (Token invalide)' });
      } else if (status === 429) {
        console.error('DHD API Error 429: Too Many Requests');
        return res.status(429).json({ error: 'Trop de requêtes vers DHD, veuillez patienter' });
      }
      
      console.error(`DHD API Error ${status}: `, error.response.data);
      return res.status(status).json({ 
        error: 'Erreur lors de la communication avec DHD', 
        details: error.response.data 
      });
    } else if (error.request) {
      console.error('DHD API Error: Pas de réponse du serveur', error.message);
      return res.status(503).json({ error: 'Service de livraison (DHD) temporairement indisponible' });
    } else {
      if (error.message === 'DHD_CONFIG_MISSING') {
        return res.status(500).json({ 
          error: "Veuillez configurer DHD_API_URL et DHD_TOKEN dans les paramètres d'environnement." 
        });
      }
      console.error('DHD API Error:', error.message);
      return res.status(500).json({ 
        error: 'Erreur interne lors de la communication avec DHD',
        details: error.message 
      });
    }
  }
};

// Endpoints
router.get('/get-fees', (req, res) => handleDhdRequest(res, () => dhdApi.get('/api/v1/get/fees')));
router.get('/wilayas', (req, res) => handleDhdRequest(res, () => dhdApi.get('/api/v1/get/wilayas')));
router.get('/communes', (req, res) => handleDhdRequest(res, () => dhdApi.get('/api/v1/get/communes', { params: req.query })));
router.get('/orders', (req, res) => handleDhdRequest(res, () => dhdApi.get('/api/v1/get/orders', { params: req.query })));
router.get('/tracking', (req, res) => handleDhdRequest(res, () => dhdApi.get('/api/v1/get/tracking/info', { params: req.query })));
router.get('/label', (req, res) => handleDhdRequest(res, () => dhdApi.get('/api/v1/get/order/label', { params: req.query })));
router.delete('/order', (req, res) => handleDhdRequest(res, () => dhdApi.delete('/api/v1/delete/order', { data: req.body })));

router.post('/create-order', (req, res) => {
  return handleDhdRequest(res, () => dhdApi.post('/api/v1/create/order', req.body));
});

router.post('/create-orders', (req, res) => {
  return handleDhdRequest(res, () => dhdApi.post('/api/v1/create/orders', req.body));
});

export default router;
