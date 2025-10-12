-- Create function to get next folio number
CREATE OR REPLACE FUNCTION public.get_next_folio_number()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('medicine_folio_seq');
$$;