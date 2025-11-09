-- Update the handle_new_user function to also assign worker role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Automatically assign worker role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker');
  
  RETURN NEW;
END;
$$;