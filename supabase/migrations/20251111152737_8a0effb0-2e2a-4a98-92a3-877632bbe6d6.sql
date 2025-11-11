-- Remove folio number system
-- Drop the trigger first
DROP TRIGGER IF EXISTS assign_folio_on_insert ON public.medicines;
DROP FUNCTION IF EXISTS assign_folio_number();

-- Drop the sequence
DROP SEQUENCE IF EXISTS medicine_folio_seq;

-- Remove folio_number column from medicines table
ALTER TABLE public.medicines DROP COLUMN IF EXISTS folio_number;