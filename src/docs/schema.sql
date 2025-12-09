-- =================================================================
--
-- RKR Laundry Supabase Database Schema
--
-- This script contains all the necessary SQL to set up the database
-- including tables for profiles, orders, and service rates, along
-- with the required Row Level Security (RLS) policies.
--
-- =================================================================

-- ----------------------------------------
-- PROFILES TABLE
-- Stores user information and roles.
-- ----------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'customer'
);

-- Enable RLS for the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Allow users to view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- ----------------------------------------
-- SERVICE_RATES TABLE
-- Stores pricing for laundry and delivery services.
-- ----------------------------------------
CREATE TABLE public.service_rates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  type TEXT NOT NULL -- 'service' or 'delivery'
);

-- Enable RLS for the service_rates table
ALTER TABLE public.service_rates ENABLE ROW LEVEL SECURITY;

-- Populate with default data
INSERT INTO public.service_rates (id, name, price, type)
VALUES
  ('wash_dry_fold', 'Wash, Dry, Fold (per 7.5kg load)', 180.00, 'service'),
  ('delivery_base', 'First 1 km', 0.00, 'delivery'), -- Represent 'Free' as 0.00
  ('delivery_per_km', 'Each additional km', 20.00, 'delivery');

-- Allow public read access for everyone
CREATE POLICY "Allow public read access on service_rates"
ON public.service_rates FOR SELECT
USING (true);

-- Allow admins to update rates
CREATE POLICY "Allow admin to update service_rates"
ON public.service_rates FOR UPDATE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ----------------------------------------
-- ORDERS TABLE
-- Stores all customer order information.
-- ----------------------------------------
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer TEXT NOT NULL,
  contact TEXT NOT NULL,
  load INTEGER NOT NULL,
  weight NUMERIC NOT NULL,
  status TEXT NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for the orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
END;
$$;

-- Allow customers to view and manage their own orders
CREATE POLICY "Allow customer to manage their own orders"
ON public.orders FOR ALL
USING (auth.uid() = customer_id);

-- Allow admins to view all orders
CREATE POLICY "Allow admin to view all orders"
ON public.orders FOR SELECT
USING (is_admin());

-- Allow admins to update all orders
CREATE POLICY "Allow admin to update all orders"
ON public.orders FOR UPDATE
USING (is_admin());
