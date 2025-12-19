-- ==========================================
-- Phase 3: Featured Products & Shop Expansion
-- ==========================================

-- 1. Add is_featured column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 2. Update Realtime publication
-- The error "relation 'products' is already member of publication" means it's already done.
-- We can safely skip this step if you've run Phase 2.
-- If you haven't, uncomment the line below:
-- ALTER PUBLICATION supabase_realtime ADD TABLE products;
