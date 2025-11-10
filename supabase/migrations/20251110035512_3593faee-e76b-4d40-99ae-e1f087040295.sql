-- Add sub_folio_number to track sequential intakes for each medicine
ALTER TABLE public.stock_transactions 
ADD COLUMN sub_folio_number integer DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX idx_stock_transactions_sub_folio ON public.stock_transactions(medicine_id, sub_folio_number);

-- Create function to get the next sub-folio number for a medicine's intakes
CREATE OR REPLACE FUNCTION public.get_next_sub_folio_number(p_medicine_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number integer;
BEGIN
  -- Get the highest sub_folio_number for this medicine and increment it
  SELECT COALESCE(MAX(sub_folio_number), 0) + 1 INTO v_next_number
  FROM public.stock_transactions
  WHERE medicine_id = p_medicine_id
    AND transaction_type = 'intake'
    AND sub_folio_number IS NOT NULL;
  
  RETURN v_next_number;
END;
$$;