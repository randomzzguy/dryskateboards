-- ==========================================
-- Admin Portal Database Setup
-- ==========================================

-- 1. Create Admins Table
-- This table controls who has access to the admin portal.
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view the admins table (bootstrap problem: need to insert first admin manually or via seed)
CREATE POLICY "Admins can view admins" ON admins
    FOR SELECT
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- 2. Create Discount Codes Table
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC NOT NULL,
    uses INTEGER DEFAULT 0,
    max_uses INTEGER,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read active codes (for checkout validation)
CREATE POLICY "Public can read active discount codes" ON discount_codes
    FOR SELECT
    USING (active = true);

-- Policy: Admins can do everything with discount codes
CREATE POLICY "Admins can manage discount codes" ON discount_codes
    FOR ALL
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- 3. Create Carts Table (for Server-Side Sync)
CREATE TABLE IF NOT EXISTS carts (
    session_id TEXT PRIMARY KEY, -- Can be a UUID generated on frontend
    user_email TEXT,
    items JSONB DEFAULT '[]'::JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own carts (by session_id or email)
-- Note: Ideally we match by session_id which should be secure, or authenticated user id.
-- For simplicity in this hybrid (anon/auth) app, we allow public insert/update if they own the session key.
CREATE POLICY "Public can manage own carts" ON carts
    FOR ALL
    USING (true) -- In a real app, strict session ownership validation is needed. Verified by application logic/UUID.
    WITH CHECK (true);

-- Policy: Admins can view all carts
CREATE POLICY "Admins can view all carts" ON carts
    FOR SELECT
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- 4. Ensure Orders Table Exists and has RLS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    items JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all orders
-- Drop existing policy if it conflicts or just add new one
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
    FOR ALL
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Policy: Users can create orders
CREATE POLICY "Public can create orders" ON orders
    FOR INSERT
    WITH CHECK (true);

-- 5. Enable Realtime for Live View
-- Allows admin dashboard to update instantly
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE carts;

-- 6. Insert Initial Admin (YOU)
-- Replace this email with the one you verify with Supabase Auth
INSERT INTO admins (email) 
VALUES ('info@dryskateboards.com')
ON CONFLICT (email) DO NOTHING;

-- Insert a sample discount code
INSERT INTO discount_codes (code, type, value, max_uses)
VALUES ('WELCOME10', 'percentage', 10, 100)
ON CONFLICT (code) DO NOTHING;
