-- ==========================================
-- Phase 4: Stock Status & Cleanup
-- ==========================================

-- 1. Add stock_status column
-- Values: 'in_stock', 'sold_out', 'coming_soon'
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock';

-- 2. Update existing products
-- Default logic: if stock <= 0, set to 'sold_out', else 'in_stock'
UPDATE products 
SET stock_status = CASE 
    WHEN stock <= 0 THEN 'sold_out'
    ELSE 'in_stock'
END
WHERE stock_status IS NULL OR stock_status = 'in_stock';
