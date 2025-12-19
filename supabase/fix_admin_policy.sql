-- ==========================================
-- FIX: Admin Access Policy
-- ==========================================

-- The previous policy created a recursion (infinite loop or catch-22):
-- "You can read this table IF you are in this table"
-- But to check if you are in the table, you need to read it.

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view admins" ON admins;

-- 2. Create a simpler policy that allows users to see THEIR OWN entry
-- This allows the `verifyAdmin` function to work because it searches for .eq('email', session.email)
CREATE POLICY "Admins can view themselves" ON admins
    FOR SELECT
    USING (email = auth.jwt() ->> 'email');

-- 3. Verify the admin exists (Just in case it wasn't inserted)
INSERT INTO admins (email) 
VALUES ('info@dryskateboards.com')
ON CONFLICT (email) DO NOTHING;
