-- ==========================================
-- Phase 2: Product Discounts & User Profiles
-- ==========================================

-- 1. Update Products Table
-- Add sale_price for discounts
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT NULL;

-- 2. Create Profiles Table
-- Stores user details linked to their Auth ID
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT, -- cached for convenience
    full_name TEXT,
    address_line1 TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    phone TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Admins can view all profiles
-- (Depends on admins table from Phase 1)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL
    USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- 3. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- 4. Create Trigger to create profile on signup (Optional but good practice)
-- This ensures a profile row exists when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger logic (commented out to avoid errors if trigger already exists, run manually if needed)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
