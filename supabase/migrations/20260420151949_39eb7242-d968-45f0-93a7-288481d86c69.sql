
-- =========================================================
-- 1. medicines: add barcode
-- =========================================================
ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS barcode text;

CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON public.medicines(barcode) WHERE barcode IS NOT NULL;

-- =========================================================
-- 2. medicine_batches
-- =========================================================
CREATE TABLE IF NOT EXISTS public.medicine_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  batch_number text,
  lot_number text,
  barcode text,
  manufacture_date date,
  expiry_date date,
  quantity_received integer NOT NULL DEFAULT 0,
  quantity_remaining integer NOT NULL DEFAULT 0,
  unit_cost numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid
);

CREATE INDEX IF NOT EXISTS idx_batches_medicine ON public.medicine_batches(medicine_id);
CREATE INDEX IF NOT EXISTS idx_batches_org ON public.medicine_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON public.medicine_batches(expiry_date) WHERE quantity_remaining > 0;
CREATE INDEX IF NOT EXISTS idx_batches_barcode ON public.medicine_batches(barcode) WHERE barcode IS NOT NULL;

ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view batches"
ON public.medicine_batches FOR SELECT
USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Authorized roles insert batches"
ON public.medicine_batches FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'pharmacist'))
);

CREATE POLICY "Authorized roles update batches"
ON public.medicine_batches FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'pharmacist'))
);

CREATE POLICY "Admins delete batches"
ON public.medicine_batches FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

CREATE TRIGGER trg_batches_updated
BEFORE UPDATE ON public.medicine_batches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create batch on purchase
CREATE OR REPLACE FUNCTION public.create_batch_from_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.medicine_batches (
    organization_id, medicine_id, supplier_id, purchase_id,
    batch_number, expiry_date, quantity_received, quantity_remaining,
    unit_cost, recorded_by
  ) VALUES (
    NEW.organization_id, NEW.medicine_id, NEW.supplier_id, NEW.id,
    NEW.batch_number, NEW.expiry_date, NEW.quantity, NEW.quantity,
    NEW.unit_cost, NEW.recorded_by
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purchase_create_batch
AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.create_batch_from_purchase();

-- =========================================================
-- 3. prescriptions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  prescription_number text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  patient_name text NOT NULL,
  patient_phone text,
  patient_age integer,
  prescriber_name text NOT NULL,
  prescriber_license text,
  prescriber_contact text,
  diagnosis text,
  notes text,
  is_controlled boolean NOT NULL DEFAULT false,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  max_refills integer NOT NULL DEFAULT 0,
  refills_used integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active', -- active | completed | cancelled | expired
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_org ON public.prescriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_customer ON public.prescriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view prescriptions"
ON public.prescriptions FOR SELECT
USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Authorized roles insert prescriptions"
ON public.prescriptions FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pharmacist') OR has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Authorized roles update prescriptions"
ON public.prescriptions FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pharmacist') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins delete prescriptions"
ON public.prescriptions FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

CREATE TRIGGER trg_prescriptions_updated
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- prescription_items
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  quantity_prescribed integer NOT NULL DEFAULT 0,
  quantity_dispensed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pres_items_prescription ON public.prescription_items(prescription_id);

ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view prescription items"
ON public.prescription_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.prescriptions p
  WHERE p.id = prescription_items.prescription_id
    AND p.organization_id = get_user_org_id(auth.uid())
));

CREATE POLICY "Authorized roles manage prescription items"
ON public.prescription_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.prescriptions p
  WHERE p.id = prescription_items.prescription_id
    AND p.organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pharmacist') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker'))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.prescriptions p
  WHERE p.id = prescription_items.prescription_id
    AND p.organization_id = get_user_org_id(auth.uid())
));

-- =========================================================
-- 4. medicine_sales: prescription + batch links
-- =========================================================
ALTER TABLE public.medicine_sales
  ADD COLUMN IF NOT EXISTS prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.medicine_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_prescription ON public.medicine_sales(prescription_id);
CREATE INDEX IF NOT EXISTS idx_sales_batch ON public.medicine_sales(batch_id);

-- Trigger: decrement batch quantity_remaining when batch_id set on sale
CREATE OR REPLACE FUNCTION public.decrement_batch_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.batch_id IS NOT NULL THEN
    UPDATE public.medicine_batches
    SET quantity_remaining = GREATEST(quantity_remaining - NEW.quantity_sold, 0),
        updated_at = now()
    WHERE id = NEW.batch_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sale_decrement_batch
AFTER INSERT ON public.medicine_sales
FOR EACH ROW EXECUTE FUNCTION public.decrement_batch_on_sale();

-- =========================================================
-- 5. purchase_attachments
-- =========================================================
CREATE TABLE IF NOT EXISTS public.purchase_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size integer,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_purchase ON public.purchase_attachments(purchase_id);

ALTER TABLE public.purchase_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view purchase attachments"
ON public.purchase_attachments FOR SELECT
USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Authorized roles insert purchase attachments"
ON public.purchase_attachments FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'pharmacist'))
);

CREATE POLICY "Admins delete purchase attachments"
ON public.purchase_attachments FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- =========================================================
-- 6. Storage bucket for supplier invoices
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-invoices', 'supplier-invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Files stored under <org_id>/<purchase_id>/<filename>
CREATE POLICY "Org members read invoice files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'supplier-invoices'
  AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
);

CREATE POLICY "Authorized roles upload invoice files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'supplier-invoices'
  AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'pharmacist'))
);

CREATE POLICY "Admins delete invoice files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'supplier-invoices'
  AND (storage.foldername(name))[1] = get_user_org_id(auth.uid())::text
  AND has_role(auth.uid(), 'admin')
);
