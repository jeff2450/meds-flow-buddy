
-- Tighten SELECT policies on medicine_sales
DROP POLICY IF EXISTS "Authenticated users can view sales" ON public.medicine_sales;
CREATE POLICY "Admins and managers can view sales"
  ON public.medicine_sales FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Tighten SELECT policies on stock_transactions
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.stock_transactions;
CREATE POLICY "Admins managers pharmacists can view transactions"
  ON public.stock_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'pharmacist'));

-- Tighten SELECT policies on stock_adjustments
DROP POLICY IF EXISTS "Authenticated users can view adjustments" ON public.stock_adjustments;
CREATE POLICY "Admins and managers can view adjustments"
  ON public.stock_adjustments FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Tighten SELECT policies on controlled_drugs_log
DROP POLICY IF EXISTS "Authenticated users can view controlled drugs log" ON public.controlled_drugs_log;
CREATE POLICY "Admins and pharmacists can view controlled drugs"
  ON public.controlled_drugs_log FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pharmacist'));

-- Update INSERT policies to include new roles
DROP POLICY IF EXISTS "Workers and admins can insert sales" ON public.medicine_sales;
CREATE POLICY "Authorized roles can insert sales"
  ON public.medicine_sales FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'pharmacist'));

DROP POLICY IF EXISTS "Workers and admins can insert transactions" ON public.stock_transactions;
CREATE POLICY "Authorized roles can insert transactions"
  ON public.stock_transactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'worker') OR has_role(auth.uid(), 'pharmacist'));

DROP POLICY IF EXISTS "Workers and admins can insert adjustments" ON public.stock_adjustments;
CREATE POLICY "Authorized roles can insert adjustments"
  ON public.stock_adjustments FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Workers and admins can insert controlled drugs log" ON public.controlled_drugs_log;
CREATE POLICY "Authorized roles can insert controlled drugs"
  ON public.controlled_drugs_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pharmacist'));

-- Update UPDATE policies
DROP POLICY IF EXISTS "Workers and admins can update sales" ON public.medicine_sales;
CREATE POLICY "Admins and managers can update sales"
  ON public.medicine_sales FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Workers and admins can update transactions" ON public.stock_transactions;
CREATE POLICY "Admins and managers can update transactions"
  ON public.stock_transactions FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create a restricted view for staff users
CREATE OR REPLACE VIEW public.medicines_staff_view AS
SELECT id, name, current_stock, min_stock_level, medicine_type
FROM public.medicines;

GRANT SELECT ON public.medicines_staff_view TO authenticated;
