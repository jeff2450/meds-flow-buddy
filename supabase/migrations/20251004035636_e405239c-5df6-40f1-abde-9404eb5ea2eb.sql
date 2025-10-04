-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'worker');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for medicine tables to require worker role
DROP POLICY IF EXISTS "Anyone can view medicines" ON public.medicines;
DROP POLICY IF EXISTS "Anyone can insert medicines" ON public.medicines;
DROP POLICY IF EXISTS "Anyone can update medicines" ON public.medicines;
DROP POLICY IF EXISTS "Anyone can delete medicines" ON public.medicines;

CREATE POLICY "Workers can view medicines"
  ON public.medicines FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can insert medicines"
  ON public.medicines FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can update medicines"
  ON public.medicines FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can delete medicines"
  ON public.medicines FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for medicine_categories
DROP POLICY IF EXISTS "Anyone can view medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Anyone can insert medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Anyone can update medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Anyone can delete medicine categories" ON public.medicine_categories;

CREATE POLICY "Workers can view medicine categories"
  ON public.medicine_categories FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can insert medicine categories"
  ON public.medicine_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can update medicine categories"
  ON public.medicine_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can delete medicine categories"
  ON public.medicine_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for stock_transactions
DROP POLICY IF EXISTS "Anyone can view stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Anyone can insert stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Anyone can update stock transactions" ON public.stock_transactions;
DROP POLICY IF EXISTS "Anyone can delete stock transactions" ON public.stock_transactions;

CREATE POLICY "Workers can view stock transactions"
  ON public.stock_transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can insert stock transactions"
  ON public.stock_transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can update stock transactions"
  ON public.stock_transactions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can delete stock transactions"
  ON public.stock_transactions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin'));