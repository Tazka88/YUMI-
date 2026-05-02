import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';

const router = Router();

// L'URL et le Token doivent rester uniquement côté serveur
// Ils peuvent être configurés via des variables d'environnement
const URL_API = process.env.ECOTRACK_API_URL || '';
const TOKEN = process.env.ECOTRACK_TOKEN || '';

// Configuration Axios pour Ecotrack
const ecotrackApi = axios.create({
  baseURL: URL_API,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Wrapper pour simplifier la gestion des erreurs Ecotrack
// On vérifie ici si l'URL est configurée
ecotrackApi.interceptors.request.use(config => {
  if (!config.baseURL || config.baseURL === '[COLLE ICI TON URL]') {
    throw new Error('ECOTRACK_CONFIG_MISSING');
  }
  return config;
});

// Schéma de validation pour create/order
const createOrderSchema = z.object({
  reference: z.string().optional(),
  nom_client: z.string().min(1, 'Le nom du client est requis'),
  telephone: z.string().regex(/^(0(5|6|7)\d{8}|[5-7]\d{8})$|^(\d{9,10})$/, 'Le numéro de téléphone doit contenir 9 ou 10 chiffres valides'),
  telephone_2: z.string().optional(),
  adresse: z.string().min(1, "L'adresse est requise"),
  wilaya: z.coerce.number().int().min(1, 'La wilaya doit être entre 1 et 58').max(58, 'La wilaya doit être entre 1 et 58'),
  commune: z.string().min(1, 'La commune est requise'),
  montant: z.coerce.number().min(0, 'Le montant doit être positif'),
  remarque: z.string().optional(),
  produit: z.string().optional(),
  type: z.coerce.number().int().min(1, 'Le type doit être entre 1 et 4').max(4, 'Le type doit être entre 1 et 4'),
  stop_desk: z.union([z.literal(0), z.literal(1), z.literal("0"), z.literal("1")]).transform(v => Number(v) as 0 | 1),
  poids: z.number().optional(),
  id_produit: z.string().optional()
}).passthrough(); // Autorise d'autres champs non spécifiés (ex: tarif, etc)

const createOrdersBatchSchema = z.array(createOrderSchema);

const updateOrderSchema = z.object({
  tracking: z.string().min(1, 'Le code tracking est requis')
}).passthrough();


// Wrapper pour simplifier la gestion des erreurs Ecotrack
const handleEcotrackRequest = async (res: any, requestFn: () => Promise<any>) => {
  try {
    const response = await requestFn();
    return res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.error('Ecotrack API Error 401: Token invalide ou expiré');
        return res.status(401).json({ error: "Problème d'authentification avec l'API de livraison (vérifiez le token)" });
      }
      if (status === 429) {
        console.error('Ecotrack API Error 429: Too Many Requests');
        const retryAfter = error.response.headers['retry-after'];
        return res.status(429).json({ error: 'Trop de requêtes, veuillez réessayer plus tard.', retryAfter });
      }
      if (status === 400 || status === 422) {
         console.error(`Ecotrack API Error ${status}: `, error.response.data);
         return res.status(status).json({ error: 'Données invalides', details: error.response.data });
      }
      console.error(`Ecotrack API Error ${status}: `, error.response.data);
      return res.status(status).json({ error: 'Erreur lors de la communication avec Ecotrack', details: error.response.data });
    } else if (error.request) {
      console.error('Ecotrack API Error: Pas de réponse du serveur Ecotrack', error.message);
      return res.status(503).json({ error: 'Service de livraison (Ecotrack) temporairement indisponible' });
    } else {
      if (error.message === 'ECOTRACK_CONFIG_MISSING' || error.message.includes('Invalid URL')) {
        return res.status(500).json({
          error: "Veuillez configurer ECOTRACK_API_URL et ECOTRACK_TOKEN dans les paramètres d'environnement.",
          details: "Configuration invalide."
        });
      }
      console.error('Ecotrack API Error:', error.message);
      return res.status(500).json({ 
        error: 'Erreur interne du serveur lors de la communication avec Ecotrack',
        details: error.message 
      });
    }
  }
};

// Routes GET
router.get('/get-fees', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.get('/api/v1/get/fees')));
router.get('/get-products', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.get('/api/v1/get/products/list')));
router.get('/wilayas', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.get('/api/v1/get/wilayas')));
router.get('/communes', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.get('/api/v1/get/communes', { params: req.query })));
router.get('/orders', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.get('/api/v1/get/orders', { params: req.query })));
router.get('/tracking', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.get('/api/v1/get/tracking/info', { params: req.query })));
router.get('/label', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.get('/api/v1/get/order/label', { params: req.query })));

// Routes DELETE
router.delete('/order', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.delete('/api/v1/delete/order', { data: req.body })));

// Route POST Simple sans validation Zod stricte (si besoin de flexibilité)
router.post('/valid/order', (req, res) => handleEcotrackRequest(res, () => ecotrackApi.post('/api/v1/valid/order', req.body)));

// Routes POST avec validation Zod
router.post('/create-order', async (req, res) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    return handleEcotrackRequest(res, () => ecotrackApi.post('/api/v1/create/order', validatedData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation failed payload:', req.body);
      console.error('Validation errors:', (error as any).errors);
      return res.status(400).json({ error: 'Erreur de validation des données utilisateurs', details: (error as any).errors });
    }
    return res.status(500).json({ error: 'Erreur inattendue' });
  }
});

router.post('/update/order', async (req, res) => {
  try {
    const validatedData = updateOrderSchema.parse(req.body);
    return handleEcotrackRequest(res, () => ecotrackApi.post('/api/v1/update/order', validatedData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Erreur de validation des données utilisateurs', details: (error as any).errors });
    }
    return res.status(500).json({ error: 'Erreur inattendue' });
  }
});

router.post('/create-orders', async (req, res) => {
  try {
    const validatedData = createOrdersBatchSchema.parse(req.body);
    return handleEcotrackRequest(res, () => ecotrackApi.post('/api/v1/create/orders', validatedData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Erreur de validation des données utilisateurs', details: (error as any).errors });
    }
    return res.status(500).json({ error: 'Erreur inattendue' });
  }
});

export default router;
