
-- Sales: set org/receipt/balance and decrement stock
DROP TRIGGER IF EXISTS trg_process_sale ON public.medicine_sales;
CREATE TRIGGER trg_process_sale
BEFORE INSERT ON public.medicine_sales
FOR EACH ROW EXECUTE FUNCTION public.process_sale();

-- Decrement batch on sale (after insert, since needs batch_id)
DROP TRIGGER IF EXISTS trg_decrement_batch_on_sale ON public.medicine_sales;
CREATE TRIGGER trg_decrement_batch_on_sale
AFTER INSERT ON public.medicine_sales
FOR EACH ROW EXECUTE FUNCTION public.decrement_batch_on_sale();

-- Purchases: update medicine stock + set org
DROP TRIGGER IF EXISTS trg_process_purchase ON public.purchases;
CREATE TRIGGER trg_process_purchase
BEFORE INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.process_purchase();

-- Create batch after purchase
DROP TRIGGER IF EXISTS trg_create_batch_from_purchase ON public.purchases;
CREATE TRIGGER trg_create_batch_from_purchase
AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.create_batch_from_purchase();

-- Stock outtake transactions
DROP TRIGGER IF EXISTS trg_process_outtake ON public.stock_transactions;
CREATE TRIGGER trg_process_outtake
AFTER INSERT ON public.stock_transactions
FOR EACH ROW EXECUTE FUNCTION public.process_outtake();

-- Payments update customer/sale balances
DROP TRIGGER IF EXISTS trg_process_payment ON public.payments;
CREATE TRIGGER trg_process_payment
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.process_payment();

-- Handle new auth user -> profile + worker role
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at maintenance on key tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'medicines','medicine_sales','medicine_batches','medicine_categories',
    'purchases','suppliers','customers','expenses','payments','prescriptions',
    'prescription_items','stock_transactions','stock_adjustments','attendance',
    'organizations','profiles','controlled_drugs_log','purchase_attachments'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;
