-- Update RLS policies to allow public access to all tables

-- Medicine categories policies
DROP POLICY IF EXISTS "Workers can view medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Workers can insert medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Workers can update medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Workers can delete medicine categories" ON public.medicine_categories;

CREATE POLICY "Anyone can view medicine categories" ON public.medicine_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert medicine categories" ON public.medicine_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update medicine categories" ON public.medicine_categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete medicine categories" ON public.medicine_categories FOR DELETE USING (true);

-- Medicines policies
DROP POLICY IF EXISTS "Workers can view medicines" ON public.medicines;
DROP POLICY IF EXISTS "Workers can insert medicines" ON public.medicines;
DROP POLICY IF EXISTS "Workers can update medicines" ON public.medicines;
DROP POLICY IF EXISTS "Workers can delete medicines" ON public.medicines;

CREATE POLICY "Anyone can view medicines" ON public.medicines FOR SELECT USING (true);
CREATE POLICY "Anyone can insert medicines" ON public.medicines FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update medicines" ON public.medicines FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete medicines" ON public.medicines FOR DELETE USING (true);

-- Stock transactions policies
DROP POLICY IF EXISTS "Workers can view stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Workers can insert stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Workers can update stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Workers can delete stock transactions" ON public.stock_transactions;

CREATE POLICY "Anyone can view stock transactions" ON public.stock_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert stock transactions" ON public.stock_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stock transactions" ON public.stock_transactions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete stock transactions" ON public.stock_transactions FOR DELETE USING (true);