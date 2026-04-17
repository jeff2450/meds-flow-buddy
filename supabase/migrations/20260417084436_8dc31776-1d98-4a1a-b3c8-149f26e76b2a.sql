-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  credit_balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_org ON public.customers(organization_id);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view customers" ON public.customers FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Authorized roles insert customers" ON public.customers FOR INSERT
  WITH CHECK (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'pharmacist') OR has_role(auth.uid(),'worker')));
CREATE POLICY "Admins managers update customers" ON public.customers FOR UPDATE
  USING (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')));
CREATE POLICY "Admins delete customers" ON public.customers FOR DELETE
  USING (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(),'admin'));

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SUPPLIERS
-- ============================================
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_suppliers_org ON public.suppliers(organization_id);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view suppliers" ON public.suppliers FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "Admins managers insert suppliers" ON public.suppliers FOR INSERT
  WITH CHECK (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'pharmacist')));
CREATE POLICY "Admins managers update suppliers" ON public.suppliers FOR UPDATE
  USING (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')));
CREATE POLICY "Admins delete suppliers" ON public.suppliers FOR DELETE
  USING (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(),'admin'));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PURCHASES (restocks from suppliers)
-- ============================================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  batch_number TEXT,
  expiry_date DATE,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid','partial','unpaid')),
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  invoice_number TEXT,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchases_org ON public.purchases(organization_id);
CREATE INDEX idx_purchases_medicine ON public.purchases(medicine_id);
CREATE INDEX idx_purchases_supplier ON public.purchases(supplier_id);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins managers view purchases" ON public.purchases FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'pharmacist')));
CREATE POLICY "Admins managers insert purchases" ON public.purchases FOR INSERT
  WITH CHECK (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'pharmacist')));
CREATE POLICY "Admins update purchases" ON public.purchases FOR UPDATE
  USING (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')));
CREATE POLICY "Admins delete purchases" ON public.purchases FOR DELETE
  USING (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(),'admin'));

-- Auto-increase stock on purchase
CREATE OR REPLACE FUNCTION public.process_purchase()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.medicines
  SET current_stock = current_stock + NEW.quantity,
      total_stock = total_stock + NEW.quantity,
      cost_price = NEW.unit_cost,
      batch_number = COALESCE(NEW.batch_number, batch_number),
      expiry_date = COALESCE(NEW.expiry_date, expiry_date),
      updated_at = now()
  WHERE id = NEW.medicine_id;
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (SELECT organization_id FROM public.medicines WHERE id = NEW.medicine_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_process_purchase AFTER INSERT ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.process_purchase();

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('rent','salary','utility','supplies','transport','marketing','maintenance','other')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash','mobile_money','bank','credit')),
  reference_number TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_org_date ON public.expenses(organization_id, expense_date DESC);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins managers view expenses" ON public.expenses FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')));
CREATE POLICY "Admins managers insert expenses" ON public.expenses FOR INSERT
  WITH CHECK (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')));
CREATE POLICY "Admins managers update expenses" ON public.expenses FOR UPDATE
  USING (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')));
CREATE POLICY "Admins delete expenses" ON public.expenses FOR DELETE
  USING (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(),'admin'));

-- ============================================
-- EXTEND medicine_sales for POS
-- ============================================
ALTER TABLE public.medicine_sales
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','mobile_money','credit','bank')),
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Receipt number sequence per org (using a function + table counter)
CREATE TABLE IF NOT EXISTS public.receipt_counters (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  next_number BIGINT NOT NULL DEFAULT 1
);
ALTER TABLE public.receipt_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view counters" ON public.receipt_counters FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.next_receipt_number(_org_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n BIGINT;
BEGIN
  INSERT INTO public.receipt_counters (organization_id, next_number)
  VALUES (_org_id, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET next_number = receipt_counters.next_number + 1
  RETURNING next_number INTO n;
  RETURN 'RCP-' || to_char(now(), 'YYYYMM') || '-' || LPAD(n::text, 5, '0');
END;
$$;

-- Update process_sale to handle credit balance + receipt
CREATE OR REPLACE FUNCTION public.process_sale()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Auto-set org from medicine
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (SELECT organization_id FROM public.medicines WHERE id = NEW.medicine_id);
  END IF;

  -- Reduce stock
  UPDATE public.medicines
  SET current_stock = current_stock - NEW.quantity_sold,
      updated_at = now()
  WHERE id = NEW.medicine_id;

  -- Auto receipt number
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := public.next_receipt_number(NEW.organization_id);
  END IF;

  -- Compute balance_due if not given
  IF NEW.total_amount IS NULL THEN
    NEW.total_amount := NEW.quantity_sold * NEW.unit_price;
  END IF;
  IF NEW.balance_due = 0 AND NEW.amount_paid < NEW.total_amount THEN
    NEW.balance_due := NEW.total_amount - NEW.amount_paid;
  END IF;

  -- If credit sale, add to customer balance
  IF NEW.payment_method = 'credit' AND NEW.customer_id IS NOT NULL AND NEW.balance_due > 0 THEN
    UPDATE public.customers
    SET credit_balance = credit_balance + NEW.balance_due,
        updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_sale ON public.medicine_sales;
CREATE TRIGGER trg_process_sale BEFORE INSERT ON public.medicine_sales
  FOR EACH ROW EXECUTE FUNCTION public.process_sale();

-- ============================================
-- PAYMENTS (against sales — for credit collection)
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES public.medicine_sales(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','mobile_money','bank','credit')),
  reference_number TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_org ON public.payments(organization_id);
CREATE INDEX idx_payments_customer ON public.payments(customer_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins managers view payments" ON public.payments FOR SELECT
  USING (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager')));
CREATE POLICY "Authorized roles insert payments" ON public.payments FOR INSERT
  WITH CHECK (organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'pharmacist') OR has_role(auth.uid(),'worker')));
CREATE POLICY "Admins delete payments" ON public.payments FOR DELETE
  USING (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(),'admin'));

-- Reduce customer credit when payment recorded
CREATE OR REPLACE FUNCTION public.process_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET credit_balance = GREATEST(credit_balance - NEW.amount, 0),
        updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  IF NEW.sale_id IS NOT NULL THEN
    UPDATE public.medicine_sales
    SET amount_paid = amount_paid + NEW.amount,
        balance_due = GREATEST(balance_due - NEW.amount, 0),
        updated_at = now()
    WHERE id = NEW.sale_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_process_payment AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.process_payment();