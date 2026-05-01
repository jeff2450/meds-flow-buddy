-- Remove medicines from realtime publication if present (defensive)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'medicines'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.medicines';
  END IF;
END$$;

-- Tighten SELECT policy: restrict reads to recognized roles only
DROP POLICY IF EXISTS "Org members can view medicines" ON public.medicines;

CREATE POLICY "Authorized roles can view medicines"
ON public.medicines
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_org_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'pharmacist'::app_role)
    OR has_role(auth.uid(), 'worker'::app_role)
  )
);