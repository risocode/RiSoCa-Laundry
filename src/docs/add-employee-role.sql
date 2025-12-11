-- Create is_employee() function to check if user has employee role
CREATE OR REPLACE FUNCTION is_employee()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'employee'
  );
END;
$$;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Allow employee to view all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow employee to update all orders" ON public.orders;

-- Add RLS policies for employees to view all orders
CREATE POLICY "Allow employee to view all orders"
ON public.orders FOR SELECT
USING (is_employee());

-- Add RLS policies for employees to update all orders
CREATE POLICY "Allow employee to update all orders"
ON public.orders FOR UPDATE
USING (is_employee()) WITH CHECK (is_employee());

-- Note: Employees cannot insert orders (only admins can create orders manually)
-- Employees can only view and update existing orders

