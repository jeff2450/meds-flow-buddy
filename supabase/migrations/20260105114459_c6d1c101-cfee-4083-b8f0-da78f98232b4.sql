-- Create a secure function for admins to get user list with minimal data
-- This prevents exposing full email addresses through the profiles table RLS

CREATE OR REPLACE FUNCTION public.get_user_list_for_admin()
RETURNS TABLE (
  id uuid,
  full_name text,
  email_masked text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    -- Mask email: show first 2 chars, mask middle, show domain
    CASE 
      WHEN p.email IS NULL THEN NULL
      WHEN length(split_part(p.email, '@', 1)) <= 2 THEN '**@' || split_part(p.email, '@', 2)
      ELSE left(split_part(p.email, '@', 1), 2) || 
           repeat('*', greatest(length(split_part(p.email, '@', 1)) - 2, 1)) || 
           '@' || split_part(p.email, '@', 2)
    END as email_masked,
    p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Remove the overly permissive admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;