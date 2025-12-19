-- ==========================================
-- FIX: Product RLS Policies
-- ==========================================

-- 1. Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Allow Public Read Access
-- Everyone should be able to see products
DROP POLICY IF EXISTS "Public can view products" ON products;
CREATE POLICY "Public can view products" ON products
    FOR SELECT
    USING (true);

-- 3. Allow Admin Full Access
-- Only admins can Insert, Update, Delete
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
    FOR ALL
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
    WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Note: The admin check relies on the user being authenticated and matching an email in the 'admins' table.
