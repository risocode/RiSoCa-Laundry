-- =================================================================
-- Fix for 403 Forbidden Error (42501 - insufficient_privilege)
-- 
-- Problem: RLS policy on orders table is blocking INSERT operations
-- because the policy only has USING clause, not WITH CHECK clause.
-- PostgreSQL requires WITH CHECK for INSERT operations.
--
-- Solution: Replace the ALL policy with separate policies that include
-- explicit WITH CHECK clauses for INSERT operations.
-- =================================================================

-- Step 1: Drop the existing policy
DROP POLICY IF EXISTS "Allow customer to manage their own orders" ON public.orders;

-- Step 2: Create separate policies with explicit WITH CHECK clauses

-- Policy 1: Allow customers to SELECT their own orders
CREATE POLICY "Allow customer to view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = customer_id);

-- Policy 2: Allow customers to INSERT their own orders
-- WITH CHECK is required for INSERT operations
CREATE POLICY "Allow customer to insert their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Policy 3: Allow customers to UPDATE their own orders
CREATE POLICY "Allow customer to update their own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- Policy 4: Allow customers to DELETE their own orders (optional)
CREATE POLICY "Allow customer to delete their own orders"
ON public.orders FOR DELETE
USING (auth.uid() = customer_id);

-- Step 3: Update admin policies to include INSERT

-- Drop existing admin policies
DROP POLICY IF EXISTS "Allow admin to view all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin to update all orders" ON public.orders;

-- Admin SELECT policy
CREATE POLICY "Allow admin to view all orders"
ON public.orders FOR SELECT
USING (is_admin());

-- Admin UPDATE policy
CREATE POLICY "Allow admin to update all orders"
ON public.orders FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Admin INSERT policy (for manual order creation)
CREATE POLICY "Allow admin to insert orders"
ON public.orders FOR INSERT
WITH CHECK (is_admin());
