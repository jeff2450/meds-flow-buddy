-- Restructure for independent batch system
-- Each medicine entry is now a unique batch with its own folio number

-- First, drop the existing triggers
DROP TRIGGER IF EXISTS update_stock_on_transaction ON public.stock_transactions;
DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON public.medicine_sales;
DROP TRIGGER IF EXISTS update_stock_on_sale ON public.medicine_sales;

-- Now drop the functions with CASCADE
DROP FUNCTION IF EXISTS update_medicine_stock() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_sale() CASCADE;
DROP FUNCTION IF EXISTS get_or_create_batch_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_next_sub_folio_number(uuid) CASCADE;

-- Remove the batch_id and sub_folio_number columns from stock_transactions
ALTER TABLE public.stock_transactions DROP COLUMN IF EXISTS batch_id;
ALTER TABLE public.stock_transactions DROP COLUMN IF EXISTS sub_folio_number;

-- Add entry_date to medicines to track when each batch was added
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS entry_date timestamp with time zone DEFAULT now();

-- Update existing medicines to have entry_date
UPDATE public.medicines 
SET entry_date = created_at 
WHERE entry_date IS NULL;

-- Make folio_number NOT NULL since every batch needs one
ALTER TABLE public.medicines 
ALTER COLUMN folio_number SET NOT NULL;

-- Update the folio sequence to continue from current max
DO $$
DECLARE
  max_folio bigint;
BEGIN
  SELECT COALESCE(MAX(folio_number::bigint), 0) INTO max_folio FROM public.medicines WHERE folio_number ~ '^\d+$';
  EXECUTE format('ALTER SEQUENCE medicine_folio_seq RESTART WITH %s', max_folio + 1);
END $$;

-- Create a trigger to auto-assign folio numbers on insert
CREATE OR REPLACE FUNCTION public.assign_folio_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.folio_number IS NULL THEN
    NEW.folio_number := get_next_folio_number()::text;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_folio_on_insert
BEFORE INSERT ON public.medicines
FOR EACH ROW
EXECUTE FUNCTION public.assign_folio_number();

-- Create function to handle outtakes - reduce stock from specific batch
CREATE OR REPLACE FUNCTION public.process_outtake()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_type = 'outtake' THEN
    UPDATE public.medicines
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.medicine_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER process_outtake_trigger
AFTER INSERT ON public.stock_transactions
FOR EACH ROW
WHEN (NEW.transaction_type = 'outtake')
EXECUTE FUNCTION public.process_outtake();

-- Create function to handle sales - reduce stock from specific batch
CREATE OR REPLACE FUNCTION public.process_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.medicines
  SET current_stock = current_stock - NEW.quantity_sold,
      updated_at = now()
  WHERE id = NEW.medicine_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER process_sale_trigger
AFTER INSERT ON public.medicine_sales
FOR EACH ROW
EXECUTE FUNCTION public.process_sale();