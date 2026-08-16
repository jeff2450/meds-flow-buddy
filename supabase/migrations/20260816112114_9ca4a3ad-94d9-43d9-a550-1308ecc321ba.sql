
-- remove duplicate triggers (keep one of each)
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS trg_batches_updated ON public.medicine_batches;
DROP TRIGGER IF EXISTS update_medicine_sales_updated_at ON public.medicine_sales;
DROP TRIGGER IF EXISTS update_medicines_updated_at ON public.medicines;
DROP TRIGGER IF EXISTS trg_prescriptions_updated ON public.prescriptions;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;

-- duplicate stock-affecting triggers => double deduction
DROP TRIGGER IF EXISTS trg_sale_decrement_batch ON public.medicine_sales;
DROP TRIGGER IF EXISTS process_sale_trigger ON public.medicine_sales;
DROP TRIGGER IF EXISTS trg_purchase_create_batch ON public.purchases;
DROP TRIGGER IF EXISTS process_outtake_trigger ON public.stock_transactions;

-- restrict stock mutation triggers to INSERT only
DROP TRIGGER IF EXISTS trg_process_sale ON public.medicine_sales;
CREATE TRIGGER trg_process_sale BEFORE INSERT ON public.medicine_sales
FOR EACH ROW EXECUTE FUNCTION public.process_sale();

DROP TRIGGER IF EXISTS trg_process_purchase ON public.purchases;
CREATE TRIGGER trg_process_purchase BEFORE INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.process_purchase();
