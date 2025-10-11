-- Add folio_number column to medicines table
ALTER TABLE public.medicines
ADD COLUMN folio_number text UNIQUE;

-- Create a sequence for auto-generating folio numbers if not provided
CREATE SEQUENCE IF NOT EXISTS medicine_folio_seq START WITH 1001;

-- Add a comment to explain the folio_number column
COMMENT ON COLUMN public.medicines.folio_number IS 'Unique folio number for medicine identification';