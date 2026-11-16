-- Migration: Customer Vouchers (Bons d'achat), Audit History, Notifications & Order Linkage
-- Safe, idempotent, strictly additive migration

CREATE TABLE IF NOT EXISTS vouchers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  code VARCHAR(40) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  minimum_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (minimum_order_amount >= 0),
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used', 'cancelled', 'expired')),
  allow_promo_stacking BOOLEAN NOT NULL DEFAULT false,
  excluded_product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  order_ref VARCHAR(50),
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  reserved_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_code_upper ON vouchers (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_order_id ON vouchers(order_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_at ON vouchers(created_at DESC);

CREATE TABLE IF NOT EXISTS voucher_history (
  id BIGSERIAL PRIMARY KEY,
  voucher_id BIGINT NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action VARCHAR(30) NOT NULL,
  actor_type VARCHAR(20) NOT NULL DEFAULT 'system',
  actor_id VARCHAR(255),
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  order_ref VARCHAR(50),
  amount NUMERIC(10, 2),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_history_voucher_id ON voucher_history(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_history_user_id ON voucher_history(user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_history_created_at ON voucher_history(created_at DESC);

CREATE TABLE IF NOT EXISTS user_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'voucher',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- Additive columns on orders (zero impact on existing orders)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_id BIGINT REFERENCES vouchers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_discount_amount NUMERIC NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_voucher_id ON orders(voucher_id);

-- Default configurable voucher rules in settings
INSERT INTO settings ("key", value)
VALUES
  ('voucher_tiers', '[{"amount":500,"minCart":10000},{"amount":1000,"minCart":15000},{"amount":2000,"minCart":30000}]'),
  ('voucher_default_excluded_products', '[]'),
  ('voucher_allow_promo_stacking', 'false')
ON CONFLICT ("key") DO NOTHING;

-- Row Level Security policies
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own vouchers" ON vouchers;
CREATE POLICY "Users can view their own vouchers" ON vouchers
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own voucher history" ON voucher_history;
CREATE POLICY "Users can view their own voucher history" ON voucher_history
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own notifications" ON user_notifications;
CREATE POLICY "Users can view their own notifications" ON user_notifications
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON user_notifications;
CREATE POLICY "Users can update their own notifications" ON user_notifications
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
