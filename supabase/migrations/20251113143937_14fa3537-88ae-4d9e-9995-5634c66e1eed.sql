-- Add total_stock column to track initial stock quantity
ALTER TABLE public.medicines
ADD COLUMN total_stock integer NOT NULL DEFAULT 0;

-- Set total_stock to current_stock for existing records
UPDATE public.medicines
SET total_stock = current_stock
WHERE total_stock = 0;

-- Remove unit column
ALTER TABLE public.medicines
DROP COLUMN unit;