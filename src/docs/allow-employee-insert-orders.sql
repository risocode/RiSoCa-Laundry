-- Allow employees to insert orders (create new orders)
-- This enables employees to create orders just like admins

DROP POLICY IF EXISTS "Allow employee to insert orders" ON public.orders;

CREATE POLICY "Allow employee to insert orders"
ON public.orders FOR INSERT
WITH CHECK (is_employee());

