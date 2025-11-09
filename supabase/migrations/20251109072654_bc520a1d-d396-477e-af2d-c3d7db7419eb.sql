-- Add batch_id column to stock_transactions to track batch groups
ALTER TABLE public.stock_transactions 
ADD COLUMN batch_id uuid DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX idx_stock_transactions_batch_id ON public.stock_transactions(batch_id);

-- Create a function to get or create batch_id for intakes
CREATE OR REPLACE FUNCTION public.get_or_create_batch_id(p_medicine_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock integer;
  v_existing_batch_id uuid;
  v_new_batch_id uuid;
BEGIN
  -- Get current stock for the medicine
  SELECT current_stock INTO v_current_stock
  FROM public.medicines
  WHERE id = p_medicine_id;
  
  -- If stock is 0, create a new batch
  IF v_current_stock = 0 THEN
    v_new_batch_id := gen_random_uuid();
    RETURN v_new_batch_id;
  END IF;
  
  -- If stock > 0, get the most recent batch_id for this medicine
  SELECT batch_id INTO v_existing_batch_id
  FROM public.stock_transactions
  WHERE medicine_id = p_medicine_id
    AND transaction_type = 'intake'
    AND batch_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no existing batch found, create new one
  IF v_existing_batch_id IS NULL THEN
    v_new_batch_id := gen_random_uuid();
    RETURN v_new_batch_id;
  END IF;
  
  RETURN v_existing_batch_id;
END;
$$;