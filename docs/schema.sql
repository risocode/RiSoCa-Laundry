-- This script is idempotent and can be run multiple times safely.

-- ========= PROFILES TABLE =========
-- Stores user profile data, linked to the auth.users table.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  first_name text NULL,
  last_name text NULL,
  role text NULL DEFAULT 'customer'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
CREATE POLICY "Allow public read access on profiles"
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.profiles;
CREATE POLICY "Allow individual user to update their own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- ========= SERVICE RATES TABLE =========
-- Stores the pricing for various services.
CREATE TABLE IF NOT EXISTS public.service_rates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  type TEXT NOT NULL -- 'service' or 'delivery'
);
ALTER TABLE public.service_rates ENABLE ROW LEVEL SECURITY;

-- Insert default data only if it doesn't exist
INSERT INTO public.service_rates (id, name, price, type)
VALUES
  ('wash_dry_fold', 'Wash, Dry, Fold (per 7.5kg load)', 180.00, 'service'),
  ('delivery_base', 'First 1 km', 0.00, 'delivery'),
  ('delivery_per_km', 'Each additional km', 20.00, 'delivery')
ON CONFLICT (id) DO NOTHING;

-- Policies for service_rates table
DROP POLICY IF EXISTS "Allow public read access on service_rates" ON public.service_rates;
CREATE POLICY "Allow public read access on service_rates"
ON public.service_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin to update service_rates" ON public.service_rates;
CREATE POLICY "Allow admin to update service_rates"
ON public.service_rates FOR UPDATE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- ========= ORDERS TABLE =========
-- Stores customer order information.
CREATE TABLE IF NOT EXISTS public.orders (
  id text not null,
  customer_id uuid null,
  customer text not null,
  contact text not null,
  load integer not null,
  weight numeric not null,
  status text not null,
  total numeric not null,
  created_at timestamp with time zone null default now(),
  constraint orders_pkey primary key (id),
  constraint orders_customer_id_fkey foreign KEY (customer_id) references profiles (id) on delete CASCADE
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;


-- ========= HELPER FUNCTION FOR ADMIN CHECK =========
-- This function checks if the currently authenticated user has the 'admin' role.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
END;
$$;


-- ========= POLICIES FOR ORDERS TABLE =========
-- Drop existing policies before creating new ones to avoid conflicts.
DROP POLICY IF EXISTS "Allow customer to view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow customer to create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin to view all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow admin to update all orders" ON public.orders;

-- Policies for Customers
CREATE POLICY "Allow customer to view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Allow customer to create their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Policies for Admins
CREATE POLICY "Allow admin to view all orders"
ON public.orders FOR SELECT
USING (is_admin());

CREATE POLICY "Allow admin to update all orders"
ON public.orders FOR UPDATE
USING (is_admin());
