-- Create daily_salary_payments table to track daily salary payments for employees
CREATE TABLE IF NOT EXISTS public.daily_salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_salary_payments_employee_date ON public.daily_salary_payments(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_salary_payments_date ON public.daily_salary_payments(date);

-- Enable RLS
ALTER TABLE public.daily_salary_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Employees can view their own daily salary payments
CREATE POLICY "Allow employees to view their own daily salary payments"
ON public.daily_salary_payments FOR SELECT
USING (auth.uid() = employee_id);

-- Admins can view all daily salary payments
CREATE POLICY "Allow admins to view all daily salary payments"
ON public.daily_salary_payments FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can insert daily salary payments
CREATE POLICY "Allow admins to insert daily salary payments"
ON public.daily_salary_payments FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Admins can update daily salary payments
CREATE POLICY "Allow admins to update daily salary payments"
ON public.daily_salary_payments FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_salary_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER daily_salary_payments_updated_at
BEFORE UPDATE ON public.daily_salary_payments
FOR EACH ROW
EXECUTE FUNCTION update_daily_salary_payments_updated_at();

