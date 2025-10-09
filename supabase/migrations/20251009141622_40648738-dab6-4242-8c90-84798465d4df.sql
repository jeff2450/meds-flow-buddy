-- Create daily medicine sales table
CREATE TABLE public.medicine_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (quantity_sold * unit_price) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries by date and medicine
CREATE INDEX idx_medicine_sales_date ON public.medicine_sales(sale_date DESC);
CREATE INDEX idx_medicine_sales_medicine ON public.medicine_sales(medicine_id);

-- Enable Row Level Security
ALTER TABLE public.medicine_sales ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view medicine sales" ON public.medicine_sales FOR SELECT USING (true);
CREATE POLICY "Anyone can insert medicine sales" ON public.medicine_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update medicine sales" ON public.medicine_sales FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete medicine sales" ON public.medicine_sales FOR DELETE USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_medicine_sales_updated_at
BEFORE UPDATE ON public.medicine_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();