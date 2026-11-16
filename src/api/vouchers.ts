import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sql } from '../db/setup.js';
import { getSupabase } from '../lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'zorando-secret-key-123';

export interface VoucherTier {
  amount: number;
  minCart: number;
}

export const DEFAULT_VOUCHER_TIERS: VoucherTier[] = [
  { amount: 500, minCart: 10000 },
  { amount: 1000, minCart: 15000 },
  { amount: 2000, minCart: 30000 },
];

export const VALIDATED_ORDER_STATUSES = ['confirmée', 'expédiée', 'livrée', 'shipped', 'delivered'];

function formatDa(n: number): string {
  return `${Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/\s/g, ' ')} DA`;
}

export function parseJsonArray(val: any): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => Number(x)).filter((x) => !isNaN(x));
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((x) => Number(x)).filter((x) => !isNaN(x));
    } catch (_) {}
  }
  return [];
}

/**
 * Extracts and verifies the authenticated customer from the Supabase Bearer token.
 * Never trusts client-provided user_id in request body.
 */
export async function verifySupabaseCustomerToken(req: any): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1]?.trim();
  if (!token) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return { id: data.user.id, email: data.user.email || undefined };
  } catch (_) {
    return null;
  }
}

export const authenticateCustomer = async (req: any, res: any, next: any) => {
  const customer = await verifySupabaseCustomerToken(req);
  if (!customer) {
    return res.status(401).json({ error: 'Authentification client requise. Veuillez vous connecter.' });
  }
  req.customer = customer;
  next();
};

export const authenticateAdminStrict = async (req: any, res: any, next: any) => {
  const authHeader = req.headers?.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1]?.trim() : null;
  if (!token) return res.status(401).json({ error: 'Accès administrateur requis' });

  // 1. Check Supabase token first -> MUST correspond to an admin in users or profiles
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        const [dbAdmin] = await sql`
          SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(${user.email || ''}) AND role = 'admin' LIMIT 1
        `;
        if (dbAdmin) {
          req.admin = { id: dbAdmin.id, email: dbAdmin.email };
          return next();
        }
        const [profileAdmin] = await sql`
          SELECT id, email, role FROM profiles WHERE id = ${user.id}::uuid AND role = 'admin' LIMIT 1
        `;
        if (profileAdmin) {
          req.admin = { id: profileAdmin.id, email: profileAdmin.email || user.email };
          return next();
        }
        return res.status(403).json({ error: 'Accès interdit : droits administrateur requis' });
      }
    } catch (_) {}
  }

  // 2. Local admin JWT fallback
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.id) {
      const [dbAdmin] = await sql`
        SELECT id, email, role FROM users WHERE id = ${decoded.id} AND role = 'admin' LIMIT 1
      `;
      if (dbAdmin) {
        req.admin = { id: dbAdmin.id, email: dbAdmin.email || decoded.username };
        return next();
      }
    }
    return res.status(403).json({ error: 'Accès interdit : droits administrateur requis' });
  } catch (_) {
    return res.status(401).json({ error: 'Session administrateur invalide ou expirée' });
  }
};

export async function getVoucherGlobalConfig() {
  const rows = await sql`
    SELECT "key", value FROM settings
    WHERE "key" IN ('voucher_tiers', 'voucher_default_excluded_products', 'voucher_allow_promo_stacking')
  `;
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }

  let tiers = DEFAULT_VOUCHER_TIERS;
  if (map.voucher_tiers) {
    try {
      const parsed = JSON.parse(map.voucher_tiers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        tiers = parsed
          .map((t: any) => ({ amount: Number(t.amount), minCart: Number(t.minCart) }))
          .filter((t: any) => t.amount > 0 && t.minCart >= 0);
      }
    } catch (_) {}
  }

  const defaultExcludedProductIds = parseJsonArray(map.voucher_default_excluded_products);
  const allowPromoStacking = map.voucher_allow_promo_stacking === 'true';

  return { tiers, defaultExcludedProductIds, allowPromoStacking };
}

export function generateVoucherCodeCandidate(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += alphabet[bytes[i] % alphabet.length];
  }
  return `ZRD-${suffix.slice(0, 4)}-${suffix.slice(4, 8)}`;
}

export async function generateUniqueVoucherCode(dbSql: any = sql): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateVoucherCodeCandidate();
    const [existing] = await dbSql`SELECT id FROM vouchers WHERE UPPER(code) = UPPER(${candidate}) LIMIT 1`;
    if (!existing) return candidate;
  }
  throw new Error('Impossible de générer un code unique de bon d\'achat');
}

/**
 * Transitions overdue 'available' vouchers to 'expired' cleanly and logs history.
 */
export async function syncExpiredVouchers(dbSql: any = sql, userId?: string) {
  const overdue = userId
    ? await dbSql`
        UPDATE vouchers
        SET status = 'expired', updated_at = NOW()
        WHERE user_id = ${userId}::uuid
          AND status = 'available'
          AND expires_at IS NOT NULL
          AND expires_at <= NOW()
        RETURNING id, user_id, amount
      `
    : await dbSql`
        UPDATE vouchers
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'available'
          AND expires_at IS NOT NULL
          AND expires_at <= NOW()
        RETURNING id, user_id, amount
      `;

  for (const v of overdue) {
    await dbSql`
      INSERT INTO voucher_history (voucher_id, user_id, action, actor_type, actor_id, amount, details)
      VALUES (${v.id}, ${v.user_id}, 'expired', 'system', 'scheduler', ${v.amount}, ${JSON.stringify({ reason: 'Expiration automatique dépassée' })}::jsonb)
    `;
  }
}

export interface VoucherCartItemInput {
  product_id?: number | string;
  id?: number | string;
  price: number;
  quantity: number;
}

export function evaluateCartEligibility(
  items: VoucherCartItemInput[],
  excludedProductIds: number[]
) {
  const excludedSet = new Set(excludedProductIds.map((x) => Number(x)));
  let totalProductsSubtotal = 0;
  let eligibleSubtotal = 0;
  let eligibleItemCount = 0;
  let excludedItemCount = 0;

  for (const item of items) {
    const pid = Number(item.product_id ?? item.id);
    const price = Number(item.price) || 0;
    const qty = Math.max(0, Number(item.quantity) || 0);
    const lineTotal = price * qty;
    totalProductsSubtotal += lineTotal;

    if (!isNaN(pid) && excludedSet.has(pid)) {
      excludedItemCount += qty;
    } else {
      eligibleSubtotal += lineTotal;
      eligibleItemCount += qty;
    }
  }

  return {
    totalProductsSubtotal,
    eligibleSubtotal,
    eligibleItemCount,
    excludedItemCount,
  };
}

/**
 * Validates a voucher code strictly on the server for a given authenticated customer and item list.
 * Note: delivery costs are intentionally never accepted or included.
 */
export async function validateVoucherForCustomer(
  dbSql: any,
  params: {
    code: string;
    userId: string;
    items: VoucherCartItemInput[];
    hasPromoCodeApplied?: boolean;
  }
): Promise<{
  valid: boolean;
  statusCode: number;
  error?: string;
  voucher?: any;
  discount_amount?: number;
  eligible_subtotal?: number;
  missing_amount?: number;
}> {
  const cleanCode = (params.code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!cleanCode) {
    return { valid: false, statusCode: 400, error: 'Veuillez saisir un code de bon d\'achat' };
  }

  await syncExpiredVouchers(dbSql, params.userId);

  const [voucher] = await dbSql`
    SELECT * FROM vouchers WHERE UPPER(code) = UPPER(${cleanCode}) LIMIT 1
  `;

  if (!voucher) {
    return { valid: false, statusCode: 404, error: 'Bon d\'achat introuvable. Vérifiez le code saisi.' };
  }

  if (String(voucher.user_id).toLowerCase() !== String(params.userId).toLowerCase()) {
    return {
      valid: false,
      statusCode: 403,
      error: 'Ce bon d\'achat est nominatif et n\'appartient pas à votre compte.',
    };
  }

  if (voucher.status === 'cancelled') {
    return { valid: false, statusCode: 400, error: 'Ce bon d\'achat a été annulé.' };
  }
  if (voucher.status === 'used') {
    return { valid: false, statusCode: 400, error: 'Ce bon d\'achat a déjà été utilisé.' };
  }
  if (voucher.status === 'reserved') {
    return {
      valid: false,
      statusCode: 400,
      error: `Ce bon d'achat est déjà réservé sur une commande en cours (${voucher.order_ref || ''}).`,
    };
  }
  if (voucher.status === 'expired' || (voucher.expires_at && new Date(voucher.expires_at) <= new Date())) {
    if (voucher.status === 'available') {
      await dbSql`UPDATE vouchers SET status = 'expired', updated_at = NOW() WHERE id = ${voucher.id}`;
    }
    return { valid: false, statusCode: 400, error: 'Ce bon d\'achat est expiré.' };
  }
  if (voucher.status !== 'available') {
    return { valid: false, statusCode: 400, error: 'Ce bon d\'achat n\'est plus disponible.' };
  }

  if (params.hasPromoCodeApplied && !voucher.allow_promo_stacking) {
    return {
      valid: false,
      statusCode: 400,
      error: 'Ce bon d\'achat n\'est pas cumulable avec un code promo. Retirez d\'abord votre code promo pour l\'utiliser.',
    };
  }

  const globalCfg = await getVoucherGlobalConfig();
  const voucherExcluded = parseJsonArray(voucher.excluded_product_ids);
  const combinedExcluded = Array.from(new Set([...globalCfg.defaultExcludedProductIds, ...voucherExcluded]));

  const eligibility = evaluateCartEligibility(params.items || [], combinedExcluded);
  const minimumRequired = Number(voucher.minimum_order_amount) || 0;
  const voucherValue = Number(voucher.amount) || 0;

  if (params.items && params.items.length > 0 && eligibility.eligibleItemCount === 0) {
    return {
      valid: false,
      statusCode: 400,
      error: 'Aucun produit de votre panier n\'est éligible à ce bon d\'achat.',
    };
  }

  if (eligibility.eligibleSubtotal < minimumRequired) {
    const missing = Math.max(0, minimumRequired - eligibility.eligibleSubtotal);
    return {
      valid: false,
      statusCode: 400,
      missing_amount: missing,
      eligible_subtotal: eligibility.eligibleSubtotal,
      error: `Panier minimum de ${formatDa(minimumRequired)} requis (hors livraison${
        eligibility.excludedItemCount > 0 ? ' et hors produits exclus' : ''
      }). Il vous manque ${formatDa(missing)} pour utiliser ce bon de ${formatDa(voucherValue)}.`,
    };
  }

  const discountAmount = Math.min(voucherValue, eligibility.eligibleSubtotal);

  return {
    valid: true,
    statusCode: 200,
    voucher,
    discount_amount: discountAmount,
    eligible_subtotal: eligibility.eligibleSubtotal,
    missing_amount: 0,
  };
}

/**
 * Atomic transaction-safe reservation of a voucher during order creation.
 * Called inside `sql.begin(...)` of `POST /api/orders`.
 */
export async function reserveVoucherInOrderTransaction(
  txSql: any,
  params: {
    voucherCode: string;
    authenticatedCustomerId: string | null;
    validatedItems: Array<{ product_id: number; price: number; quantity: number }>;
    calculatedTotal: number;
    promoDiscount: number;
    hasPromoCodeApplied: boolean;
  }
) {
  if (!params.authenticatedCustomerId) {
    throw new Error('Vous devez être connecté à votre compte client pour utiliser un bon d\'achat.');
  }

  const cleanCode = params.voucherCode.trim().toUpperCase().replace(/\s+/g, '');

  // Row-level lock guarantees only ONE concurrent request can ever inspect/reserve this voucher
  const [lockedVoucher] = await txSql`
    SELECT * FROM vouchers WHERE UPPER(code) = UPPER(${cleanCode}) FOR UPDATE
  `;

  if (!lockedVoucher) {
    throw new Error('Bon d\'achat introuvable.');
  }

  if (String(lockedVoucher.user_id).toLowerCase() !== String(params.authenticatedCustomerId).toLowerCase()) {
    throw new Error('Ce bon d\'achat n\'appartient pas à votre compte.');
  }

  if (lockedVoucher.status === 'cancelled') {
    throw new Error('Ce bon d\'achat a été annulé et ne peut pas être utilisé.');
  }
  if (lockedVoucher.status === 'used') {
    throw new Error('Ce bon d\'achat a déjà été utilisé.');
  }
  if (lockedVoucher.status === 'reserved') {
    throw new Error('Ce bon d\'achat est déjà utilisé sur une autre commande en cours.');
  }
  if (
    lockedVoucher.status === 'expired' ||
    (lockedVoucher.expires_at && new Date(lockedVoucher.expires_at) <= new Date())
  ) {
    throw new Error('Ce bon d\'achat est expiré.');
  }
  if (lockedVoucher.status !== 'available') {
    throw new Error('Ce bon d\'achat n\'est pas disponible.');
  }

  if (params.hasPromoCodeApplied && !lockedVoucher.allow_promo_stacking) {
    throw new Error('Ce bon d\'achat n\'est pas cumulable avec un code promo.');
  }

  const globalCfg = await getVoucherGlobalConfig();
  const voucherExcluded = parseJsonArray(lockedVoucher.excluded_product_ids);
  const combinedExcluded = Array.from(new Set([...globalCfg.defaultExcludedProductIds, ...voucherExcluded]));

  const eligibility = evaluateCartEligibility(params.validatedItems, combinedExcluded);
  const minimumRequired = Number(lockedVoucher.minimum_order_amount) || 0;

  if (eligibility.eligibleItemCount === 0) {
    throw new Error('Aucun article de votre commande n\'est éligible à ce bon d\'achat.');
  }

  if (eligibility.eligibleSubtotal < minimumRequired) {
    const missing = Math.max(0, minimumRequired - eligibility.eligibleSubtotal);
    throw new Error(
      `Montant minimum de ${formatDa(minimumRequired)} non atteint sur les produits éligibles (il manque ${formatDa(missing)}, hors livraison).`
    );
  }

  // Discount only touches products subtotal (never shipping)
  const remainingProductsTotal = Math.max(0, params.calculatedTotal - params.promoDiscount);
  const voucherDiscount = Math.min(
    Number(lockedVoucher.amount) || 0,
    eligibility.eligibleSubtotal,
    remainingProductsTotal
  );

  // Atomically reserve while order is in 'nouvelle' (pending verification)
  const [reserved] = await txSql`
    UPDATE vouchers
    SET status = 'reserved',
        reserved_at = NOW(),
        updated_at = NOW()
    WHERE id = ${lockedVoucher.id}
      AND status = 'available'
    RETURNING *
  `;

  if (!reserved) {
    throw new Error('Ce bon d\'achat vient déjà d\'être utilisé.');
  }

  return {
    voucher: reserved,
    voucherDiscount,
  };
}

export async function linkReservedVoucherToOrder(
  txSql: any,
  params: {
    voucherId: number;
    customerUserId: string;
    orderId: number;
    orderRef: string;
    voucherAmount: number;
    voucherDiscount: number;
  }
) {
  await txSql`
    UPDATE vouchers
    SET order_id = ${params.orderId},
        order_ref = ${params.orderRef},
        updated_at = NOW()
    WHERE id = ${params.voucherId}
  `;

  await txSql`
    INSERT INTO voucher_history (voucher_id, user_id, action, actor_type, actor_id, order_id, order_ref, amount, details)
    VALUES (
      ${params.voucherId},
      ${params.customerUserId}::uuid,
      'reserved',
      'customer',
      ${params.customerUserId},
      ${params.orderId},
      ${params.orderRef},
      ${params.voucherDiscount},
      ${JSON.stringify({ voucher_face_amount: params.voucherAmount, discount_applied: params.voucherDiscount })}::jsonb
    )
  `;
}

/**
 * Updates voucher lifecycle whenever an order status transitions via Admin.
 * - Validated states ('confirmée', 'expédiée', 'livrée') -> 'used'
 * - 'annulée' before validation ('reserved') -> released back to 'available' (or 'expired')
 */
export async function handleOrderStatusVoucherLifecycle(
  txSql: any,
  params: {
    orderId: number | string;
    newStatus: string;
    adminActor?: string;
  }
) {
  const [voucher] = await txSql`
    SELECT * FROM vouchers WHERE order_id = ${Number(params.orderId)} FOR UPDATE
  `;
  if (!voucher) return;

  const actorId = params.adminActor || 'admin';
  const normalizedStatus = (params.newStatus || '').toLowerCase();

  if (VALIDATED_ORDER_STATUSES.includes(normalizedStatus)) {
    if (voucher.status === 'reserved') {
      await txSql`
        UPDATE vouchers
        SET status = 'used',
            used_at = COALESCE(used_at, NOW()),
            updated_at = NOW()
        WHERE id = ${voucher.id}
      `;

      await txSql`
        INSERT INTO voucher_history (voucher_id, user_id, action, actor_type, actor_id, order_id, order_ref, amount, details)
        VALUES (
          ${voucher.id},
          ${voucher.user_id},
          'used',
          'admin',
          ${actorId},
          ${Number(params.orderId)},
          ${voucher.order_ref},
          ${voucher.amount},
          ${JSON.stringify({ order_status: params.newStatus })}::jsonb
        )
      `;
    }
  } else if (normalizedStatus === 'annulée' || normalizedStatus === 'cancelled') {
    if (voucher.status === 'reserved') {
      const isNowExpired = voucher.expires_at && new Date(voucher.expires_at) <= new Date();
      const restoredStatus = isNowExpired ? 'expired' : 'available';

      await txSql`
        UPDATE vouchers
        SET status = ${restoredStatus},
            order_id = NULL,
            order_ref = NULL,
            reserved_at = NULL,
            updated_at = NOW()
        WHERE id = ${voucher.id}
      `;

      await txSql`
        UPDATE orders
        SET voucher_id = NULL
        WHERE id = ${Number(params.orderId)}
      `;

      await txSql`
        INSERT INTO voucher_history (voucher_id, user_id, action, actor_type, actor_id, order_id, order_ref, amount, details)
        VALUES (
          ${voucher.id},
          ${voucher.user_id},
          'released',
          'admin',
          ${actorId},
          ${Number(params.orderId)},
          ${voucher.order_ref},
          ${voucher.amount},
          ${JSON.stringify({ reason: 'Commande annulée avant validation définitive', restored_status: restoredStatus })}::jsonb
        )
      `;

      if (restoredStatus === 'available') {
        await txSql`
          INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
          VALUES (
            ${voucher.user_id},
            'voucher',
            ${"Bon d'achat libéré"},
            ${`Suite à l'annulation de la commande ${voucher.order_ref || ''}, votre bon d'achat ${voucher.code} (${formatDa(voucher.amount)}) est de nouveau disponible !`},
            '/account/vouchers',
            ${JSON.stringify({ voucher_id: voucher.id, code: voucher.code, amount: Number(voucher.amount) })}::jsonb
          )
        `;
      }
    }
  }
}

export async function releaseVoucherOnOrderDelete(
  txSql: any,
  params: { orderId: number | string; adminActor?: string }
) {
  const [voucher] = await txSql`
    SELECT * FROM vouchers WHERE order_id = ${Number(params.orderId)} FOR UPDATE
  `;
  if (!voucher || voucher.status !== 'reserved') return;

  const isNowExpired = voucher.expires_at && new Date(voucher.expires_at) <= new Date();
  const restoredStatus = isNowExpired ? 'expired' : 'available';

  await txSql`
    UPDATE vouchers
    SET status = ${restoredStatus},
        order_id = NULL,
        order_ref = NULL,
        reserved_at = NULL,
        updated_at = NOW()
    WHERE id = ${voucher.id}
  `;

  await txSql`
    INSERT INTO voucher_history (voucher_id, user_id, action, actor_type, actor_id, order_id, order_ref, amount, details)
    VALUES (
      ${voucher.id},
      ${voucher.user_id},
      'released',
      'admin',
      ${params.adminActor || 'admin'},
      NULL,
      ${voucher.order_ref},
      ${voucher.amount},
      ${JSON.stringify({ reason: 'Commande supprimée avant validation définitive', restored_status: restoredStatus })}::jsonb
    )
  `;
}

// ==========================================
// EXPRESS ROUTER FOR VOUCHERS & NOTIFICATIONS
// ==========================================
const voucherRouter = Router();

// --- CUSTOMER ROUTES (Authenticated Client) ---

voucherRouter.get('/account/vouchers', authenticateCustomer, async (req: any, res) => {
  try {
    await syncExpiredVouchers(sql, req.customer.id);

    const vouchers = await sql`
      SELECT
        v.id,
        v.user_id,
        v.user_email,
        v.code,
        v.amount,
        v.minimum_order_amount,
        v.reason,
        v.status,
        v.allow_promo_stacking,
        v.excluded_product_ids,
        v.order_id,
        v.order_ref,
        v.created_at,
        v.expires_at,
        v.reserved_at,
        v.used_at,
        v.cancelled_at
      FROM vouchers v
      WHERE v.user_id = ${req.customer.id}::uuid
      ORDER BY
        CASE v.status
          WHEN 'available' THEN 0
          WHEN 'reserved' THEN 1
          WHEN 'used' THEN 2
          WHEN 'expired' THEN 3
          ELSE 4
        END,
        v.created_at DESC
    `;

    const totalAvailableBalance = vouchers
      .filter((v: any) => v.status === 'available')
      .reduce((sum: number, v: any) => sum + Number(v.amount || 0), 0);

    const availableCount = vouchers.filter((v: any) => v.status === 'available').length;

    res.json({
      vouchers,
      summary: {
        totalAvailableBalance,
        availableCount,
        totalCount: vouchers.length,
      },
    });
  } catch (err) {
    console.error('Error fetching customer vouchers:', err);
    res.status(500).json({ error: 'Impossible de charger vos bons d\'achat.' });
  }
});

voucherRouter.get('/account/notifications', authenticateCustomer, async (req: any, res) => {
  try {
    const notifications = await sql`
      SELECT id, type, title, message, link, metadata, is_read, created_at
      FROM user_notifications
      WHERE user_id = ${req.customer.id}::uuid
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const unreadCount = notifications.filter((n: any) => !n.is_read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Impossible de charger vos notifications.' });
  }
});

voucherRouter.patch('/account/notifications/read-all', authenticateCustomer, async (req: any, res) => {
  try {
    await sql`
      UPDATE user_notifications SET is_read = true WHERE user_id = ${req.customer.id}::uuid AND is_read = false
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des notifications.' });
  }
});

voucherRouter.patch('/account/notifications/:id/read', authenticateCustomer, async (req: any, res) => {
  try {
    await sql`
      UPDATE user_notifications
      SET is_read = true
      WHERE id = ${Number(req.params.id)} AND user_id = ${req.customer.id}::uuid
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification.' });
  }
});

voucherRouter.post('/vouchers/validate', authenticateCustomer, async (req: any, res) => {
  try {
    const { code, items, has_promo_code } = req.body;
    const result = await validateVoucherForCustomer(sql, {
      code,
      userId: req.customer.id,
      items: Array.isArray(items) ? items : [],
      hasPromoCodeApplied: Boolean(has_promo_code),
    });

    if (!result.valid) {
      return res.status(result.statusCode).json({
        valid: false,
        error: result.error,
        missing_amount: result.missing_amount ?? null,
        eligible_subtotal: result.eligible_subtotal ?? null,
      });
    }

    const v = result.voucher;
    res.json({
      valid: true,
      voucher: {
        id: v.id,
        code: v.code,
        amount: Number(v.amount),
        minimum_order_amount: Number(v.minimum_order_amount),
        allow_promo_stacking: Boolean(v.allow_promo_stacking),
        excluded_product_ids: parseJsonArray(v.excluded_product_ids),
        expires_at: v.expires_at,
        reason: v.reason,
      },
      discount_amount: result.discount_amount,
      eligible_subtotal: result.eligible_subtotal,
      message: `Bon d'achat ${v.code} appliqué (-${formatDa(result.discount_amount || v.amount)})`,
    });
  } catch (err) {
    console.error('Error validating voucher:', err);
    res.status(500).json({ error: 'Erreur lors de la vérification du bon d\'achat.' });
  }
});

// --- ADMIN ROUTES (Strict Admin Auth) ---

voucherRouter.get('/admin/vouchers/config', authenticateAdminStrict, async (_req, res) => {
  try {
    const config = await getVoucherGlobalConfig();
    let excludedProductsDetails: any[] = [];
    if (config.defaultExcludedProductIds.length > 0) {
      excludedProductsDetails = await sql`
        SELECT id, name, sku, price, promo_price
        FROM products
        WHERE id = ANY(${config.defaultExcludedProductIds}::bigint[])
      `;
    }
    res.json({ ...config, excludedProductsDetails });
  } catch (err) {
    console.error('Error reading voucher config:', err);
    res.status(500).json({ error: 'Impossible de charger la configuration des bons d\'achat.' });
  }
});

voucherRouter.put('/admin/vouchers/config', authenticateAdminStrict, async (req, res) => {
  try {
    const { tiers, defaultExcludedProductIds, allowPromoStacking } = req.body;

    if (Array.isArray(tiers) && tiers.length > 0) {
      const sanitizedTiers = tiers
        .map((t: any) => ({
          amount: Math.max(1, Number(t.amount) || 0),
          minCart: Math.max(0, Number(t.minCart) || 0),
        }))
        .filter((t: any) => t.amount > 0);

      await sql`
        INSERT INTO settings ("key", value) VALUES ('voucher_tiers', ${JSON.stringify(sanitizedTiers)})
        ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value
      `;
    }

    if (Array.isArray(defaultExcludedProductIds)) {
      const sanitizedExcluded = Array.from(
        new Set(defaultExcludedProductIds.map((x: any) => Number(x)).filter((x: number) => !isNaN(x) && x > 0))
      );
      await sql`
        INSERT INTO settings ("key", value) VALUES ('voucher_default_excluded_products', ${JSON.stringify(sanitizedExcluded)})
        ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value
      `;
    }

    if (typeof allowPromoStacking === 'boolean') {
      await sql`
        INSERT INTO settings ("key", value) VALUES ('voucher_allow_promo_stacking', ${String(allowPromoStacking)})
        ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value
      `;
    }

    const updated = await getVoucherGlobalConfig();
    res.json(updated);
  } catch (err) {
    console.error('Error updating voucher config:', err);
    res.status(500).json({ error: 'Impossible de sauvegarder la configuration.' });
  }
});

voucherRouter.get('/admin/vouchers/customer-search', authenticateAdminStrict, async (req, res) => {
  try {
    const emailQuery = String(req.query.email || '').trim().toLowerCase();
    if (!emailQuery || emailQuery.length < 2) {
      return res.json([]);
    }

    const searchPattern = `%${emailQuery}%`;
    const customers = await sql`
      SELECT
        u.id,
        u.email,
        u.created_at as account_created_at,
        u.raw_user_meta_data,
        p.first_name,
        p.last_name,
        p.phone,
        p.wilaya,
        p.commune,
        (SELECT COUNT(*)::int FROM orders o WHERE o.customer_user_id = u.id::text) as orders_count,
        (SELECT COUNT(*)::int FROM vouchers v WHERE v.user_id = u.id AND v.status = 'available') as active_vouchers_count
      FROM auth.users u
      LEFT JOIN profiles p ON p.id = u.id
      WHERE LOWER(u.email) LIKE ${searchPattern}
         OR LOWER(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE ${searchPattern}
         OR COALESCE(p.phone, '') LIKE ${searchPattern}
      ORDER BY
        CASE WHEN LOWER(u.email) = ${emailQuery} THEN 0 ELSE 1 END,
        u.created_at DESC
      LIMIT 12
    `;

    const formatted = customers.map((c: any) => {
      const metaName = c.raw_user_meta_data?.full_name || c.raw_user_meta_data?.name || '';
      const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || metaName || 'Client ZORANDO';
      return {
        id: c.id,
        email: c.email,
        full_name: fullName,
        phone: c.phone || c.raw_user_meta_data?.phone || '',
        wilaya: c.wilaya || '',
        commune: c.commune || '',
        orders_count: c.orders_count || 0,
        active_vouchers_count: c.active_vouchers_count || 0,
        account_created_at: c.account_created_at,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error searching customer by email:', err);
    res.status(500).json({ error: 'Erreur lors de la recherche du compte client.' });
  }
});

voucherRouter.get('/admin/vouchers/generate-code', authenticateAdminStrict, async (_req, res) => {
  try {
    const code = await generateUniqueVoucherCode(sql);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: 'Impossible de générer un code unique.' });
  }
});

voucherRouter.get('/admin/vouchers', authenticateAdminStrict, async (req, res) => {
  try {
    await syncExpiredVouchers(sql);

    const statusFilter = String(req.query.status || 'all');
    const amountFilter = req.query.amount ? Number(req.query.amount) : null;
    const search = String(req.query.search || '').trim();

    let conditions: any[] = [];
    if (statusFilter && statusFilter !== 'all') {
      conditions.push(sql`v.status = ${statusFilter}`);
    }
    if (amountFilter && !isNaN(amountFilter) && amountFilter > 0) {
      conditions.push(sql`v.amount = ${amountFilter}`);
    }
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        sql`(v.code ILIKE ${pattern} OR v.user_email ILIKE ${pattern} OR COALESCE(v.user_name, '') ILIKE ${pattern} OR COALESCE(v.order_ref, '') ILIKE ${pattern})`
      );
    }

    let whereSql = sql``;
    if (conditions.length > 0) {
      whereSql = sql`WHERE ${conditions.reduce((acc, cond, idx) => (idx === 0 ? cond : sql`${acc} AND ${cond}`))}`;
    }

    const vouchers = await sql`
      SELECT
        v.*,
        o.status as order_status,
        o.total_amount as order_total_amount
      FROM vouchers v
      LEFT JOIN orders o ON v.order_id = o.id
      ${whereSql}
      ORDER BY v.created_at DESC
    `;

    const [stats] = await sql`
      SELECT
        COUNT(*)::int as total_issued,
        COUNT(*) FILTER (WHERE status = 'used')::int as total_used,
        COUNT(*) FILTER (WHERE status = 'available')::int as total_available,
        COUNT(*) FILTER (WHERE status = 'reserved')::int as total_reserved,
        COUNT(*) FILTER (WHERE status = 'expired')::int as total_expired,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int as total_cancelled,
        COALESCE(SUM(amount), 0)::numeric as total_issued_value,
        COALESCE(SUM(amount) FILTER (WHERE status = 'used'), 0)::numeric as total_used_value,
        COALESCE(SUM(amount) FILTER (WHERE status = 'available'), 0)::numeric as total_available_value
      FROM vouchers
    `;

    res.json({
      vouchers,
      stats: {
        total_issued: stats?.total_issued || 0,
        total_used: stats?.total_used || 0,
        total_available: stats?.total_available || 0,
        total_reserved: stats?.total_reserved || 0,
        total_expired: stats?.total_expired || 0,
        total_cancelled: stats?.total_cancelled || 0,
        total_issued_value: Number(stats?.total_issued_value || 0),
        total_used_value: Number(stats?.total_used_value || 0),
        total_available_value: Number(stats?.total_available_value || 0),
      },
    });
  } catch (err) {
    console.error('Error listing admin vouchers:', err);
    res.status(500).json({ error: 'Impossible de charger les bons d\'achat.' });
  }
});

voucherRouter.get('/admin/vouchers/history', authenticateAdminStrict, async (req, res) => {
  try {
    const voucherId = req.query.voucher_id ? Number(req.query.voucher_id) : null;
    const history = voucherId
      ? await sql`
          SELECT vh.*, v.code, v.user_email, v.user_name
          FROM voucher_history vh
          JOIN vouchers v ON v.id = vh.voucher_id
          WHERE vh.voucher_id = ${voucherId}
          ORDER BY vh.created_at DESC
          LIMIT 200
        `
      : await sql`
          SELECT vh.*, v.code, v.user_email, v.user_name
          FROM voucher_history vh
          JOIN vouchers v ON v.id = vh.voucher_id
          ORDER BY vh.created_at DESC
          LIMIT 200
        `;
    res.json(history);
  } catch (err) {
    console.error('Error fetching voucher history:', err);
    res.status(500).json({ error: 'Impossible de charger l\'historique.' });
  }
});

voucherRouter.post('/admin/vouchers', authenticateAdminStrict, async (req: any, res) => {
  try {
    const {
      user_id,
      amount,
      minimum_order_amount,
      reason,
      expires_at,
      code,
      allow_promo_stacking,
      excluded_product_ids,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Veuillez sélectionner un compte client existant.' });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Le montant du bon d\'achat doit être supérieur à 0 DA.' });
    }

    const numericMinCart = Number(minimum_order_amount);
    if (isNaN(numericMinCart) || numericMinCart < 0) {
      return res.status(400).json({ error: 'Le panier minimum doit être valide (>= 0 DA).' });
    }

    if (numericMinCart > 0 && numericAmount >= numericMinCart) {
      return res.status(400).json({
        error: 'Le montant du bon d\'achat doit être strictement inférieur au panier minimum requis.',
      });
    }

    // Verify existing customer account in auth.users
    const [customer] = await sql`
      SELECT u.id, u.email, u.raw_user_meta_data, p.first_name, p.last_name
      FROM auth.users u
      LEFT JOIN profiles p ON p.id = u.id
      WHERE u.id = ${user_id}::uuid
      LIMIT 1
    `;

    if (!customer) {
      return res.status(404).json({ error: 'Compte client introuvable dans la base utilisateurs.' });
    }

    let expiryIso: string | null = null;
    if (expires_at) {
      const parsedExp = new Date(expires_at);
      if (isNaN(parsedExp.getTime())) {
        return res.status(400).json({ error: 'Date d\'expiration invalide.' });
      }
      if (parsedExp <= new Date()) {
        return res.status(400).json({ error: 'La date d\'expiration doit être dans le futur.' });
      }
      expiryIso = parsedExp.toISOString();
    }

    const globalCfg = await getVoucherGlobalConfig();
    const stackingFlag =
      typeof allow_promo_stacking === 'boolean' ? allow_promo_stacking : globalCfg.allowPromoStacking;
    const excludedList = Array.isArray(excluded_product_ids)
      ? Array.from(new Set(excluded_product_ids.map((x: any) => Number(x)).filter((x: number) => !isNaN(x) && x > 0)))
      : [];

    const metaName = customer.raw_user_meta_data?.full_name || customer.raw_user_meta_data?.name || '';
    const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() || metaName || 'Client ZORANDO';
    const adminActor = req.admin?.email || String(req.admin?.id || 'admin');

    const createdVoucher = await sql.begin(async (txSql: any) => {
      let finalCode = (code || '').trim().toUpperCase().replace(/\s+/g, '');
      if (finalCode) {
        const [dup] = await txSql`SELECT id FROM vouchers WHERE UPPER(code) = UPPER(${finalCode}) LIMIT 1`;
        if (dup) throw new Error(`Le code "${finalCode}" est déjà utilisé.`);
      } else {
        finalCode = await generateUniqueVoucherCode(txSql);
      }

      const [voucher] = await txSql`
        INSERT INTO vouchers (
          user_id, user_email, user_name, code, amount, minimum_order_amount,
          reason, status, allow_promo_stacking, excluded_product_ids,
          created_by, expires_at
        )
        VALUES (
          ${customer.id}::uuid,
          ${customer.email},
          ${fullName},
          ${finalCode},
          ${numericAmount},
          ${numericMinCart},
          ${(reason || '').trim() || 'Geste commercial ZORANDO'},
          'available',
          ${stackingFlag},
          ${JSON.stringify(excludedList)}::jsonb,
          ${adminActor},
          ${expiryIso}
        )
        RETURNING *
      `;

      await txSql`
        INSERT INTO voucher_history (voucher_id, user_id, action, actor_type, actor_id, amount, details)
        VALUES (
          ${voucher.id},
          ${customer.id}::uuid,
          'issued',
          'admin',
          ${adminActor},
          ${numericAmount},
          ${JSON.stringify({
            minimum_order_amount: numericMinCart,
            reason: voucher.reason,
            expires_at: expiryIso,
            allow_promo_stacking: stackingFlag,
            excluded_product_ids: excludedList,
          })}::jsonb
        )
      `;

      const minText = numericMinCart > 0 ? ` dès ${formatDa(numericMinCart)} d'achats` : '';
      const expText = expiryIso
        ? ` Valable jusqu'au ${new Date(expiryIso).toLocaleDateString('fr-FR')}.`
        : '';

      await txSql`
        INSERT INTO user_notifications (user_id, type, title, message, link, metadata)
        VALUES (
          ${customer.id}::uuid,
          'voucher',
          ${`Nouveau bon d'achat de ${formatDa(numericAmount)} !`},
          ${`Vous avez reçu un bon d'achat de ${formatDa(numericAmount)} (code : ${finalCode}), utilisable${minText} (hors livraison).${expText}`},
          '/account/vouchers',
          ${JSON.stringify({
            voucher_id: voucher.id,
            code: finalCode,
            amount: numericAmount,
            minimum_order_amount: numericMinCart,
            expires_at: expiryIso,
          })}::jsonb
        )
      `;

      return voucher;
    });

    res.status(201).json(createdVoucher);
  } catch (err: any) {
    console.error('Error creating voucher:', err);
    res.status(400).json({ error: err.message || 'Impossible de créer le bon d\'achat.' });
  }
});

voucherRouter.put('/admin/vouchers/:id', authenticateAdminStrict, async (req: any, res) => {
  try {
    const voucherId = Number(req.params.id);
    const {
      amount,
      minimum_order_amount,
      reason,
      expires_at,
      allow_promo_stacking,
      excluded_product_ids,
    } = req.body;

    const [existing] = await sql`SELECT * FROM vouchers WHERE id = ${voucherId}`;
    if (!existing) return res.status(404).json({ error: 'Bon d\'achat introuvable.' });

    if (existing.status !== 'available') {
      return res.status(400).json({
        error: `Impossible de modifier un bon d'achat au statut "${existing.status}". Seuls les bons disponibles peuvent être modifiés.`,
      });
    }

    const nextAmount = amount !== undefined ? Number(amount) : Number(existing.amount);
    const nextMinCart = minimum_order_amount !== undefined ? Number(minimum_order_amount) : Number(existing.minimum_order_amount);

    if (isNaN(nextAmount) || nextAmount <= 0) {
      return res.status(400).json({ error: 'Montant invalide.' });
    }
    if (isNaN(nextMinCart) || nextMinCart < 0) {
      return res.status(400).json({ error: 'Panier minimum invalide.' });
    }
    if (nextMinCart > 0 && nextAmount >= nextMinCart) {
      return res.status(400).json({ error: 'Le montant du bon doit rester inférieur au panier minimum.' });
    }

    let nextExpiresAt = existing.expires_at;
    if (expires_at === null || expires_at === '') {
      nextExpiresAt = null;
    } else if (expires_at !== undefined) {
      const d = new Date(expires_at);
      if (isNaN(d.getTime()) || d <= new Date()) {
        return res.status(400).json({ error: 'La date d\'expiration doit être valide et dans le futur.' });
      }
      nextExpiresAt = d.toISOString();
    }

    const nextReason = reason !== undefined ? String(reason).trim() : existing.reason;
    const nextStacking = typeof allow_promo_stacking === 'boolean' ? allow_promo_stacking : existing.allow_promo_stacking;
    const nextExcluded = Array.isArray(excluded_product_ids)
      ? Array.from(new Set(excluded_product_ids.map((x: any) => Number(x)).filter((x: number) => !isNaN(x) && x > 0)))
      : parseJsonArray(existing.excluded_product_ids);

    const adminActor = req.admin?.email || String(req.admin?.id || 'admin');

    const updated = await sql.begin(async (txSql: any) => {
      const [row] = await txSql`
        UPDATE vouchers
        SET amount = ${nextAmount},
            minimum_order_amount = ${nextMinCart},
            reason = ${nextReason},
            expires_at = ${nextExpiresAt},
            allow_promo_stacking = ${nextStacking},
            excluded_product_ids = ${JSON.stringify(nextExcluded)}::jsonb,
            updated_at = NOW()
        WHERE id = ${voucherId} AND status = 'available'
        RETURNING *
      `;
      if (!row) throw new Error('Le bon d\'achat n\'est plus modifiable.');

      await txSql`
        INSERT INTO voucher_history (voucher_id, user_id, action, actor_type, actor_id, amount, details)
        VALUES (
          ${voucherId},
          ${existing.user_id},
          'updated',
          'admin',
          ${adminActor},
          ${nextAmount},
          ${JSON.stringify({
            previous_amount: Number(existing.amount),
            new_amount: nextAmount,
            previous_min: Number(existing.minimum_order_amount),
            new_min: nextMinCart,
            new_expires_at: nextExpiresAt,
            reason: nextReason,
          })}::jsonb
        )
      `;
      return row;
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating voucher:', err);
    res.status(400).json({ error: err.message || 'Impossible de modifier le bon d\'achat.' });
  }
});

voucherRouter.post('/admin/vouchers/:id/cancel', authenticateAdminStrict, async (req: any, res) => {
  try {
    const voucherId = Number(req.params.id);
    const reasonText = String(req.body?.reason || 'Annulé par l\'administrateur').trim();

    const [existing] = await sql`SELECT * FROM vouchers WHERE id = ${voucherId}`;
    if (!existing) return res.status(404).json({ error: 'Bon d\'achat introuvable.' });

    if (existing.status !== 'available') {
      return res.status(400).json({
        error: `Impossible d'annuler ce bon (statut actuel : ${existing.status}).`,
      });
    }

    const adminActor = req.admin?.email || String(req.admin?.id || 'admin');

    const cancelled = await sql.begin(async (txSql: any) => {
      const [row] = await txSql`
        UPDATE vouchers
        SET status = 'cancelled',
            cancelled_at = NOW(),
            updated_at = NOW()
        WHERE id = ${voucherId} AND status = 'available'
        RETURNING *
      `;
      if (!row) throw new Error('Ce bon ne peut plus être annulé.');

      await txSql`
        INSERT INTO voucher_history (voucher_id, user_id, action, actor_type, actor_id, amount, details)
        VALUES (
          ${voucherId},
          ${existing.user_id},
          'cancelled',
          'admin',
          ${adminActor},
          ${existing.amount},
          ${JSON.stringify({ reason: reasonText })}::jsonb
        )
      `;
      return row;
    });

    res.json(cancelled);
  } catch (err: any) {
    console.error('Error cancelling voucher:', err);
    res.status(400).json({ error: err.message || 'Impossible d\'annuler le bon d\'achat.' });
  }
});

export default voucherRouter;
