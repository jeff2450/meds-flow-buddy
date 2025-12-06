-- First, drop the existing admin profile SELECT policy and recreate it with explicit role check
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate the policy with explicit and correct role checking
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Also restrict users from updating their email field directly
-- Drop current update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new update policy that restricts what can be updated
-- Users can update their profile but email changes should match their auth email
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (email IS NULL OR email = auth.email())
);