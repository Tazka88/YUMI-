import express from 'express';
import { sql } from '../db/setup.js';
import { authenticate } from './routes.js';

const router = express.Router();

// GET all landing pages (Admin)
router.get('/admin/landing-pages', authenticate, async (req, res) => {
  try {
    const pages = await sql`
      SELECT lp.*, p.name as product_name, 
      CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp?v=' || LENGTH(p.image) ELSE p.image END as product_image
      FROM landing_pages lp
      LEFT JOIN products p ON lp.product_id = p.id
      ORDER BY lp.created_at DESC
    `;
    res.json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du chargement des landing pages' });
  }
});

// POST new landing page
router.post('/admin/landing-pages', authenticate, async (req, res) => {
  const { product_id, slug, config } = req.body;
  try {
    const [page] = await sql`
      INSERT INTO landing_pages (product_id, slug, config)
      VALUES (${product_id}, ${slug}, ${sql.json(config)})
      RETURNING *
    `;
    res.status(201).json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création de la landing page' });
  }
});

// PUT update landing page
router.put('/admin/landing-pages/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { product_id, slug, config } = req.body;
  try {
    const [page] = await sql`
      UPDATE landing_pages
      SET product_id = ${product_id}, slug = ${slug}, config = ${sql.json(config)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    res.json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// DELETE landing page
router.delete('/admin/landing-pages/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM landing_pages WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// GET landing page by slug (Public)
router.get('/landing-pages/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const [page] = await sql`
      SELECT lp.*, p.name as product_name, p.description as product_description, p.price, p.promo_price, p.stock, p.features, p.key_points, p.faq_q1, p.faq_a1, p.faq_q2, p.faq_a2, p.variations,
      CASE WHEN p.image LIKE 'data:image/%' THEN '/api/images/products/' || p.id || '/image/' || p.slug || '.webp?v=' || LENGTH(p.image) ELSE p.image END as product_image
      FROM landing_pages lp
      JOIN products p ON lp.product_id = p.id
      WHERE lp.slug = ${slug}
    `;
    
    if (!page) {
      return res.status(404).json({ error: 'Page non trouvée' });
    }
    
    // Fetch product images
    const images = await sql`
      SELECT id, is_main, alt_text, 
      CASE WHEN image LIKE 'data:image/%' THEN '/api/images/product_images/' || id || '/image?v=' || LENGTH(image) ELSE image END as image_url
      FROM product_images WHERE product_id = ${page.product_id}
    `;
    
    // Fetch product reviews
    const reviews = await sql`
      SELECT id, customer_name, rating, comment, status, created_at,
      CASE WHEN image_url LIKE 'data:image/%' THEN '/api/images/reviews/' || id || '/image_url?v=' || LENGTH(image_url) ELSE image_url END as image_url
      FROM reviews WHERE product_id = ${page.product_id} AND status = 'approved'
      ORDER BY created_at DESC
    `;

    page.product_images = images;
    page.product_reviews = reviews;

    res.json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
