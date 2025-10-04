-- Create medicine categories table
CREATE TABLE public.medicine_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.medicine_categories(id) ON DELETE SET NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'units',
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create stock transactions table (for intake and outtake)
CREATE TABLE public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('intake', 'outtake')),
  quantity INTEGER NOT NULL,
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.medicine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access (since this is an inventory management system, we'll make it accessible)
-- Medicine Categories - Public access
CREATE POLICY "Anyone can view medicine categories"
  ON public.medicine_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert medicine categories"
  ON public.medicine_categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update medicine categories"
  ON public.medicine_categories FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete medicine categories"
  ON public.medicine_categories FOR DELETE
  USING (true);

-- Medicines - Public access
CREATE POLICY "Anyone can view medicines"
  ON public.medicines FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update medicines"
  ON public.medicines FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete medicines"
  ON public.medicines FOR DELETE
  USING (true);

-- Stock Transactions - Public access
CREATE POLICY "Anyone can view stock transactions"
  ON public.stock_transactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert stock transactions"
  ON public.stock_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update stock transactions"
  ON public.stock_transactions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete stock transactions"
  ON public.stock_transactions FOR DELETE
  USING (true);

-- Create function to update medicine stock when transaction is added
CREATE OR REPLACE FUNCTION public.update_medicine_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_type = 'intake' THEN
    UPDATE public.medicines
    SET current_stock = current_stock + NEW.quantity,
        updated_at = now()
    WHERE id = NEW.medicine_id;
  ELSIF NEW.transaction_type = 'outtake' THEN
    UPDATE public.medicines
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.medicine_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for automatic stock updates
CREATE TRIGGER update_stock_on_transaction
  AFTER INSERT ON public.stock_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_medicine_stock();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates on medicines
CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.medicine_categories (name, description) VALUES
  ('Antibiotics', 'Medications used to treat bacterial infections'),
  ('Pain Relief', 'Analgesics and pain management medications'),
  ('Cardiovascular', 'Heart and blood pressure medications'),
  ('Vitamins & Supplements', 'Nutritional supplements and vitamins'),
  ('Respiratory', 'Medications for respiratory conditions');