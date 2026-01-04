-- Add medicine classification type
CREATE TYPE public.medicine_type AS ENUM ('prescription', 'otc', 'controlled', 'medical_supplies');

-- Add cost_price and medicine_type to medicines table
ALTER TABLE public.medicines 
ADD COLUMN cost_price numeric DEFAULT 0,
ADD COLUMN medicine_type medicine_type DEFAULT 'otc';

-- Add user tracking to medicine_sales
ALTER TABLE public.medicine_sales 
ADD COLUMN recorded_by uuid REFERENCES auth.users(id),
ADD COLUMN is_prescription boolean DEFAULT false;

-- Add user tracking to stock_transactions
ALTER TABLE public.stock_transactions 
ADD COLUMN recorded_by uuid REFERENCES auth.users(id);

-- Create stock_adjustments table for losses, damages, returns
CREATE TABLE public.stock_adjustments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    adjustment_type text NOT NULL CHECK (adjustment_type IN ('damage', 'expired', 'customer_return', 'supplier_return', 'theft', 'other')),
    quantity integer NOT NULL,
    value numeric DEFAULT 0,
    notes text,
    recorded_by uuid REFERENCES auth.users(id),
    adjustment_date timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on stock_adjustments
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_adjustments
CREATE POLICY "Authenticated users can view adjustments"
ON public.stock_adjustments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Workers and admins can insert adjustments"
ON public.stock_adjustments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'worker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update adjustments"
ON public.stock_adjustments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete adjustments"
ON public.stock_adjustments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit_logs table for tracking all changes
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    old_data jsonb,
    new_data jsonb,
    performed_by uuid REFERENCES auth.users(id),
    performed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create controlled_drugs_log for legal compliance
CREATE TABLE public.controlled_drugs_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    log_date date NOT NULL DEFAULT CURRENT_DATE,
    opening_balance integer NOT NULL DEFAULT 0,
    quantity_received integer NOT NULL DEFAULT 0,
    quantity_dispensed integer NOT NULL DEFAULT 0,
    closing_balance integer NOT NULL DEFAULT 0,
    prescriber_reference text,
    variance integer DEFAULT 0,
    compliance_confirmed boolean DEFAULT false,
    notes text,
    recorded_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on controlled_drugs_log
ALTER TABLE public.controlled_drugs_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view controlled drugs log"
ON public.controlled_drugs_log FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Workers and admins can insert controlled drugs log"
ON public.controlled_drugs_log FOR INSERT
WITH CHECK (has_role(auth.uid(), 'worker'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update controlled drugs log"
ON public.controlled_drugs_log FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete controlled drugs log"
ON public.controlled_drugs_log FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, performed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'insert', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, performed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create audit triggers for key tables
CREATE TRIGGER audit_medicines
AFTER INSERT OR UPDATE OR DELETE ON public.medicines
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_medicine_sales
AFTER INSERT OR UPDATE OR DELETE ON public.medicine_sales
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_stock_transactions
AFTER INSERT OR UPDATE OR DELETE ON public.stock_transactions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_stock_adjustments
AFTER INSERT OR UPDATE OR DELETE ON public.stock_adjustments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();