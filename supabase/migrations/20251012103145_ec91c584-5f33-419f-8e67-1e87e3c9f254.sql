-- Create function to update stock when a sale is recorded
CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrease the stock when a sale is recorded
  UPDATE public.medicines
  SET current_stock = current_stock - NEW.quantity_sold,
      updated_at = now()
  WHERE id = NEW.medicine_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update stock on medicine sales
CREATE TRIGGER trigger_update_stock_on_sale
  AFTER INSERT ON public.medicine_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_sale();