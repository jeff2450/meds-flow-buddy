
-- 1. Create organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Seed a default organization for existing data
INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Pharmacy', 'default-pharmacy');

-- 3. Add organization_id to profiles
ALTER TABLE public.profiles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
UPDATE public.profiles SET organization_id = '00000000-0000-0000-0000-000000000001';

-- 4. Add organization_id + new fields to medicines
ALTER TABLE public.medicines ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.medicines ADD COLUMN expiry_date date;
ALTER TABLE public.medicines ADD COLUMN batch_number text;
ALTER TABLE public.medicines ADD COLUMN selling_price numeric DEFAULT 0;
UPDATE public.medicines SET organization_id = '00000000-0000-0000-0000-000000000001';

-- 5. Add organization_id to all other core tables
ALTER TABLE public.medicine_sales ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
UPDATE public.medicine_sales SET organization_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.stock_transactions ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
UPDATE public.stock_transactions SET organization_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.stock_adjustments ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
UPDATE public.stock_adjustments SET organization_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.controlled_drugs_log ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
UPDATE public.controlled_drugs_log SET organization_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.attendance ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
UPDATE public.attendance SET organization_id = '00000000-0000-0000-0000-000000000001';

-- 6. Create security definer function to get user org
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- 7. Update handle_new_user to set org from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(
      (NEW.raw_user_meta_data->>'organization_id')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker');
  RETURN NEW;
END;
$$;

-- ========================================
-- DROP ALL EXISTING RLS POLICIES
-- ========================================

-- organizations (new table, no old policies)

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- medicines
DROP POLICY IF EXISTS "Authenticated users can view medicines" ON public.medicines;
DROP POLICY IF EXISTS "Workers and admins can insert medicines" ON public.medicines;
DROP POLICY IF EXISTS "Workers and admins can update medicines" ON public.medicines;
DROP POLICY IF EXISTS "Only admins can delete medicines" ON public.medicines;

-- medicine_sales
DROP POLICY IF EXISTS "Admins and managers can view sales" ON public.medicine_sales;
DROP POLICY IF EXISTS "Authorized roles can insert sales" ON public.medicine_sales;
DROP POLICY IF EXISTS "Admins and managers can update sales" ON public.medicine_sales;
DROP POLICY IF EXISTS "Only admins can delete sales" ON public.medicine_sales;

-- stock_transactions
DROP POLICY IF EXISTS "Admins managers pharmacists can view transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Authorized roles can insert transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Admins and managers can update transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Only admins can delete transactions" ON public.stock_transactions;

-- stock_adjustments
DROP POLICY IF EXISTS "Admins and managers can view adjustments" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Authorized roles can insert adjustments" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Only admins can update adjustments" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Only admins can delete adjustments" ON public.stock_adjustments;

-- controlled_drugs_log
DROP POLICY IF EXISTS "Admins and pharmacists can view controlled drugs" ON public.controlled_drugs_log;
DROP POLICY IF EXISTS "Authorized roles can insert controlled drugs" ON public.controlled_drugs_log;
DROP POLICY IF EXISTS "Only admins can update controlled drugs log" ON public.controlled_drugs_log;
DROP POLICY IF EXISTS "Only admins can delete controlled drugs log" ON public.controlled_drugs_log;

-- attendance
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;

-- ========================================
-- RECREATE ALL POLICIES WITH ORG SCOPING
-- ========================================

-- ORGANIZATIONS
CREATE POLICY "Members can view their org"
  ON public.organizations FOR SELECT
  USING (id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins can update their org"
  ON public.organizations FOR UPDATE
  USING (id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- PROFILES (org-scoped)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view org profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- MEDICINES (org-scoped, all authenticated can view within org)
CREATE POLICY "Org members can view medicines"
  ON public.medicines FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Workers admins can insert medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Workers admins can update medicines"
  ON public.medicines FOR UPDATE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can delete medicines"
  ON public.medicines FOR DELETE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- MEDICINE_SALES (org-scoped, admin+manager view)
CREATE POLICY "Admins managers view sales"
  ON public.medicine_sales FOR SELECT
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Authorized roles insert sales"
  ON public.medicine_sales FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
      OR has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'pharmacist'))
  );

CREATE POLICY "Admins managers update sales"
  ON public.medicine_sales FOR UPDATE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins delete sales"
  ON public.medicine_sales FOR DELETE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- STOCK_TRANSACTIONS (org-scoped, admin+manager+pharmacist view)
CREATE POLICY "Admins managers pharmacists view transactions"
  ON public.stock_transactions FOR SELECT
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'pharmacist'))
  );

CREATE POLICY "Authorized roles insert transactions"
  ON public.stock_transactions FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
      OR has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'pharmacist'))
  );

CREATE POLICY "Admins managers update transactions"
  ON public.stock_transactions FOR UPDATE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins delete transactions"
  ON public.stock_transactions FOR DELETE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- STOCK_ADJUSTMENTS (org-scoped, admin+manager)
CREATE POLICY "Admins managers view adjustments"
  ON public.stock_adjustments FOR SELECT
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins managers insert adjustments"
  ON public.stock_adjustments FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins update adjustments"
  ON public.stock_adjustments FOR UPDATE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins delete adjustments"
  ON public.stock_adjustments FOR DELETE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- CONTROLLED_DRUGS_LOG (org-scoped, admin+pharmacist)
CREATE POLICY "Admins pharmacists view controlled drugs"
  ON public.controlled_drugs_log FOR SELECT
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pharmacist'))
  );

CREATE POLICY "Admins pharmacists insert controlled drugs"
  ON public.controlled_drugs_log FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pharmacist'))
  );

CREATE POLICY "Admins update controlled drugs"
  ON public.controlled_drugs_log FOR UPDATE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins delete controlled drugs"
  ON public.controlled_drugs_log FOR DELETE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- ATTENDANCE (org-scoped)
CREATE POLICY "Users view own attendance"
  ON public.attendance FOR SELECT
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND auth.uid() = user_id
  );

CREATE POLICY "Admins view org attendance"
  ON public.attendance FOR SELECT
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users insert own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND auth.uid() = user_id
  );

CREATE POLICY "Users update own attendance"
  ON public.attendance FOR UPDATE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND auth.uid() = user_id
  );

CREATE POLICY "Admins delete attendance"
  ON public.attendance FOR DELETE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- MEDICINE_CATEGORIES (org-scoped - add org_id)
ALTER TABLE public.medicine_categories ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
UPDATE public.medicine_categories SET organization_id = '00000000-0000-0000-0000-000000000001';

DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Workers and admins can insert categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Workers and admins can update categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON public.medicine_categories;

CREATE POLICY "Org members view categories"
  ON public.medicine_categories FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Workers admins insert categories"
  ON public.medicine_categories FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Workers admins update categories"
  ON public.medicine_categories FOR UPDATE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins delete categories"
  ON public.medicine_categories FOR DELETE
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- AUDIT_LOGS (org-scoped)
ALTER TABLE public.audit_logs ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
UPDATE public.audit_logs SET organization_id = '00000000-0000-0000-0000-000000000001';

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins view org audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND has_role(auth.uid(), 'admin')
  );

-- Update medicines_staff_view to include new fields and org filter
DROP VIEW IF EXISTS public.medicines_staff_view;
CREATE VIEW public.medicines_staff_view
WITH (security_invoker = on)
AS
SELECT id, name, current_stock, min_stock_level, medicine_type, organization_id
FROM public.medicines;

-- Update process_sale to set org_id from medicine
CREATE OR REPLACE FUNCTION public.process_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.medicines
  SET current_stock = current_stock - NEW.quantity_sold,
      updated_at = now()
  WHERE id = NEW.medicine_id;
  
  -- Auto-set organization_id from medicine if not provided
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (SELECT organization_id FROM public.medicines WHERE id = NEW.medicine_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_medicines_org ON public.medicines(organization_id);
CREATE INDEX IF NOT EXISTS idx_medicine_sales_org ON public.medicine_sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_org ON public.stock_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_org ON public.stock_adjustments(organization_id);
CREATE INDEX IF NOT EXISTS idx_controlled_drugs_org ON public.controlled_drugs_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_org ON public.attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON public.medicines(expiry_date);
