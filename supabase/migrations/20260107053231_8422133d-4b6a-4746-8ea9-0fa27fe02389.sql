-- Create attendance table for staff time tracking
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clock_out TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Workers can view their own attendance
CREATE POLICY "Users can view their own attendance"
ON public.attendance
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all attendance
CREATE POLICY "Admins can view all attendance"
ON public.attendance
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Workers can clock in (insert their own records)
CREATE POLICY "Users can insert their own attendance"
ON public.attendance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Workers can clock out (update their own records)
CREATE POLICY "Users can update their own attendance"
ON public.attendance
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can delete attendance records
CREATE POLICY "Admins can delete attendance"
ON public.attendance
FOR DELETE
USING (has_role(auth.uid(), 'admin'));