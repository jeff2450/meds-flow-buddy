-- Fix RLS policies for medicines table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view medicines" ON public.medicines;
DROP POLICY IF EXISTS "Anyone can insert medicines" ON public.medicines;
DROP POLICY IF EXISTS "Anyone can update medicines" ON public.medicines;
DROP POLICY IF EXISTS "Anyone can delete medicines" ON public.medicines;

-- Create secure role-based policies for medicines
CREATE POLICY "Authenticated users can view medicines"
  ON public.medicines
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Workers and admins can insert medicines"
  ON public.medicines
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'worker'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Workers and admins can update medicines"
  ON public.medicines
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'worker'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Only admins can delete medicines"
  ON public.medicines
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix RLS policies for medicine_sales table
DROP POLICY IF EXISTS "Anyone can view medicine sales" ON public.medicine_sales;
DROP POLICY IF EXISTS "Anyone can insert medicine sales" ON public.medicine_sales;
DROP POLICY IF EXISTS "Anyone can update medicine sales" ON public.medicine_sales;
DROP POLICY IF EXISTS "Anyone can delete medicine sales" ON public.medicine_sales;

CREATE POLICY "Authenticated users can view sales"
  ON public.medicine_sales
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Workers and admins can insert sales"
  ON public.medicine_sales
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'worker'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Workers and admins can update sales"
  ON public.medicine_sales
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'worker'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Only admins can delete sales"
  ON public.medicine_sales
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix RLS policies for stock_transactions table
DROP POLICY IF EXISTS "Anyone can view stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Anyone can insert stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Anyone can update stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Anyone can delete stock transactions" ON public.stock_transactions;

CREATE POLICY "Authenticated users can view transactions"
  ON public.stock_transactions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Workers and admins can insert transactions"
  ON public.stock_transactions
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'worker'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Workers and admins can update transactions"
  ON public.stock_transactions
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'worker'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Only admins can delete transactions"
  ON public.stock_transactions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix RLS policies for medicine_categories table
DROP POLICY IF EXISTS "Anyone can view medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Anyone can insert medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Anyone can update medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Anyone can delete medicine categories" ON public.medicine_categories;

CREATE POLICY "Authenticated users can view categories"
  ON public.medicine_categories
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Workers and admins can insert categories"
  ON public.medicine_categories
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'worker'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Workers and admins can update categories"
  ON public.medicine_categories
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'worker'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Only admins can delete categories"
  ON public.medicine_categories
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin access to profiles table for user management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add validation constraints to prevent negative/zero values
ALTER TABLE public.medicine_sales 
  ADD CONSTRAINT positive_quantity CHECK (quantity_sold > 0),
  ADD CONSTRAINT positive_price CHECK (unit_price > 0);

ALTER TABLE public.stock_transactions 
  ADD CONSTRAINT positive_transaction_quantity CHECK (quantity > 0);