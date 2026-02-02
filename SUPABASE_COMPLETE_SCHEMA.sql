-- =====================================================
-- RKR Laundry - Complete Supabase Database Schema
-- =====================================================
-- This file contains all tables, functions, RLS policies,
-- indexes, and triggers needed for the RKR Laundry frontend
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
-- Stores user profile information linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    contact_number TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'employee', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =====================================================
-- 2. BRANCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Format: RKR000001, RKR000002, etc.
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    service_package TEXT NOT NULL CHECK (service_package IN ('package1', 'package2', 'package3')),
    weight NUMERIC(10, 2) NOT NULL,
    loads INTEGER NOT NULL,
    distance NUMERIC(10, 2) DEFAULT 0,
    delivery_option TEXT,
    status TEXT NOT NULL DEFAULT 'Order Placed',
    total NUMERIC(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    balance NUMERIC(10, 2),
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    order_type TEXT DEFAULT 'customer' CHECK (order_type IN ('customer', 'internal')),
    assigned_employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- For backward compatibility
    assigned_employee_ids JSONB, -- Array of employee UUIDs: ["uuid1", "uuid2"]
    load_pieces JSONB, -- Array of piece counts: [30, 25, 20]
    found_items JSONB, -- Array of found items: ["wallet", "keys", "phone"]
    canceled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    canceled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_employee_id ON public.orders(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON public.orders(branch_id);

-- GIN index for JSONB array searches
CREATE INDEX IF NOT EXISTS idx_orders_assigned_employee_ids ON public.orders USING GIN (assigned_employee_ids);

-- =====================================================
-- 4. ORDER_STATUS_HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for order status history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- =====================================================
-- 5. EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT,
    expense_for TEXT NOT NULL CHECK (expense_for IN ('Racky', 'Karaya', 'Richard', 'RKR')),
    incurred_on DATE NOT NULL,
    reimbursement_status TEXT CHECK (reimbursement_status IN ('pending', 'reimbursed')),
    reimbursed_at TIMESTAMPTZ,
    reimbursed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_expense_for ON public.expenses(expense_for);
CREATE INDEX IF NOT EXISTS idx_expenses_reimbursement_status ON public.expenses(reimbursement_status);
CREATE INDEX IF NOT EXISTS idx_expenses_incurred_on ON public.expenses(incurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON public.expenses(branch_id);

-- =====================================================
-- 6. DAILY_SALARY_PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    load_completion JSONB DEFAULT '{}', -- Stores load completion data per order
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Indexes for daily salary payments
CREATE INDEX IF NOT EXISTS idx_daily_salary_payments_employee_id ON public.daily_salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_salary_payments_date ON public.daily_salary_payments(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_salary_payments_employee_date ON public.daily_salary_payments(employee_id, date);

-- =====================================================
-- 7. ORDER_RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    contact_number TEXT,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    feedback_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id) -- One rating per order
);

-- Indexes for ratings
CREATE INDEX IF NOT EXISTS idx_order_ratings_order_id ON public.order_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_order_ratings_created_at ON public.order_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_ratings_overall_rating ON public.order_ratings(overall_rating);

-- =====================================================
-- 8. RATING_LIKES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rating_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rating_id UUID NOT NULL REFERENCES public.order_ratings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rating_id, user_id) -- One like per user per rating
);

-- Indexes for rating likes
CREATE INDEX IF NOT EXISTS idx_rating_likes_rating_id ON public.rating_likes(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_likes_user_id ON public.rating_likes(user_id);

-- =====================================================
-- 9. PROMOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.promos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    price_per_load NUMERIC(10, 2) NOT NULL,
    display_date TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for promos
CREATE INDEX IF NOT EXISTS idx_promos_is_active ON public.promos(is_active);
CREATE INDEX IF NOT EXISTS idx_promos_end_date ON public.promos(end_date);
CREATE INDEX IF NOT EXISTS idx_promos_start_date ON public.promos(start_date);

-- =====================================================
-- 10. ELECTRICITY_READINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.electricity_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading NUMERIC(10, 2) NOT NULL,
    reading_date DATE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reading_date) -- One reading per date
);

-- Indexes for electricity readings
CREATE INDEX IF NOT EXISTS idx_electricity_readings_reading_date ON public.electricity_readings(reading_date DESC);

-- =====================================================
-- 11. SERVICE_RATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.service_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('service', 'delivery')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for service rates
CREATE INDEX IF NOT EXISTS idx_service_rates_type ON public.service_rates(type);
CREATE INDEX IF NOT EXISTS idx_service_rates_is_active ON public.service_rates(is_active);

-- =====================================================
-- 12. BANK_SAVINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bank_savings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly', 'custom')),
    amount NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bank savings
CREATE INDEX IF NOT EXISTS idx_bank_savings_period_type ON public.bank_savings(period_type);
CREATE INDEX IF NOT EXISTS idx_bank_savings_period_start ON public.bank_savings(period_start);
CREATE INDEX IF NOT EXISTS idx_bank_savings_period_end ON public.bank_savings(period_end);

-- =====================================================
-- 13. NET_INCOME_DISTRIBUTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.net_income_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly', 'custom')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    owner_name TEXT NOT NULL CHECK (owner_name IN ('Racky', 'Karaya', 'Richard')),
    claimed_amount NUMERIC(10, 2) NOT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for distributions
CREATE INDEX IF NOT EXISTS idx_net_income_distributions_period_type ON public.net_income_distributions(period_type);
CREATE INDEX IF NOT EXISTS idx_net_income_distributions_owner_name ON public.net_income_distributions(owner_name);
CREATE INDEX IF NOT EXISTS idx_net_income_distributions_period_start ON public.net_income_distributions(period_start);
CREATE INDEX IF NOT EXISTS idx_net_income_distributions_period_end ON public.net_income_distributions(period_end);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get the latest order ID
CREATE OR REPLACE FUNCTION public.get_latest_order_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    latest_id TEXT;
BEGIN
    SELECT id INTO latest_id
    FROM public.orders
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN latest_id;
END;
$$;

-- Function to get order by ID and customer name (for customer lookup)
CREATE OR REPLACE FUNCTION public.get_order_by_id_and_name(
    p_order_id TEXT,
    p_customer_name TEXT
)
RETURNS TABLE (
    id TEXT,
    customer_id UUID,
    customer_name TEXT,
    contact_number TEXT,
    service_package TEXT,
    weight NUMERIC,
    loads INTEGER,
    distance NUMERIC,
    delivery_option TEXT,
    status TEXT,
    total NUMERIC,
    is_paid BOOLEAN,
    balance NUMERIC,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    order_type TEXT,
    assigned_employee_id UUID,
    assigned_employee_ids JSONB,
    load_pieces JSONB,
    found_items JSONB,
    order_status_history JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.customer_id,
        o.customer_name,
        o.contact_number,
        o.service_package,
        o.weight,
        o.loads,
        o.distance,
        o.delivery_option,
        o.status,
        o.total,
        o.is_paid,
        o.balance,
        o.created_at,
        o.updated_at,
        o.order_type,
        o.assigned_employee_id,
        o.assigned_employee_ids,
        o.load_pieces,
        o.found_items,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'status', osh.status,
                        'created_at', osh.created_at
                    ) ORDER BY osh.created_at
                )
                FROM public.order_status_history osh
                WHERE osh.order_id = o.id
            ),
            '[]'::jsonb
        ) AS order_status_history
    FROM public.orders o
    WHERE o.id = p_order_id
        AND LOWER(TRIM(o.customer_name)) = LOWER(TRIM(p_customer_name));
END;
$$;

-- Function to update order ID when status changes to "Order Placed"
CREATE OR REPLACE FUNCTION public.update_order_id_on_placed(
    p_order_id TEXT,
    p_new_order_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update order ID
    UPDATE public.orders
    SET id = p_new_order_id
    WHERE id = p_order_id;
    
    -- Update order_status_history references
    UPDATE public.order_status_history
    SET order_id = p_new_order_id
    WHERE order_id = p_order_id;
    
    -- Update order_ratings references
    UPDATE public.order_ratings
    SET order_id = p_new_order_id
    WHERE order_id = p_order_id;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_salary_payments_updated_at BEFORE UPDATE ON public.daily_salary_payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_ratings_updated_at BEFORE UPDATE ON public.order_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promos_updated_at BEFORE UPDATE ON public.promos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_electricity_readings_updated_at BEFORE UPDATE ON public.electricity_readings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_rates_updated_at BEFORE UPDATE ON public.service_rates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_savings_updated_at BEFORE UPDATE ON public.bank_savings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_net_income_distributions_updated_at BEFORE UPDATE ON public.net_income_distributions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_income_distributions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$;

-- Helper function to check if user is employee
CREATE OR REPLACE FUNCTION public.is_employee(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'employee'
    );
END;
$$;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Admins can delete profiles
CREATE POLICY "Admins can delete all profiles"
    ON public.profiles FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- ORDERS POLICIES
-- =====================================================

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = customer_id);

-- Customers can insert their own orders
CREATE POLICY "Customers can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

-- Admins and employees can view all orders
CREATE POLICY "Admins and employees can view all orders"
    ON public.orders FOR SELECT
    USING (
        public.is_admin(auth.uid()) OR 
        public.is_employee(auth.uid())
    );

-- Admins and employees can insert orders
CREATE POLICY "Admins and employees can insert orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        public.is_admin(auth.uid()) OR 
        public.is_employee(auth.uid())
    );

-- Admins and employees can update orders
CREATE POLICY "Admins and employees can update orders"
    ON public.orders FOR UPDATE
    USING (
        public.is_admin(auth.uid()) OR 
        public.is_employee(auth.uid())
    );

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
    ON public.orders FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- ORDER_STATUS_HISTORY POLICIES
-- =====================================================

-- Customers can view history for their own orders
CREATE POLICY "Customers can view own order history"
    ON public.order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_status_history.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Admins and employees can view all order history
CREATE POLICY "Admins and employees can view all order history"
    ON public.order_status_history FOR SELECT
    USING (
        public.is_admin(auth.uid()) OR 
        public.is_employee(auth.uid())
    );

-- Admins and employees can insert order history
CREATE POLICY "Admins and employees can insert order history"
    ON public.order_status_history FOR INSERT
    WITH CHECK (
        public.is_admin(auth.uid()) OR 
        public.is_employee(auth.uid())
    );

-- Admins and employees can update order history
CREATE POLICY "Admins and employees can update order history"
    ON public.order_status_history FOR UPDATE
    USING (
        public.is_admin(auth.uid()) OR 
        public.is_employee(auth.uid())
    );

-- Admins can delete order history
CREATE POLICY "Admins can delete order history"
    ON public.order_status_history FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- EXPENSES POLICIES
-- =====================================================

-- Only admins can view expenses
CREATE POLICY "Admins can view expenses"
    ON public.expenses FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Only admins can insert expenses
CREATE POLICY "Admins can insert expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update expenses
CREATE POLICY "Admins can update expenses"
    ON public.expenses FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Only admins can delete expenses
CREATE POLICY "Admins can delete expenses"
    ON public.expenses FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- DAILY_SALARY_PAYMENTS POLICIES
-- =====================================================

-- Employees can view their own salary payments
CREATE POLICY "Employees can view own salary payments"
    ON public.daily_salary_payments FOR SELECT
    USING (auth.uid() = employee_id);

-- Admins can view all salary payments
CREATE POLICY "Admins can view all salary payments"
    ON public.daily_salary_payments FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Admins can insert salary payments
CREATE POLICY "Admins can insert salary payments"
    ON public.daily_salary_payments FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update salary payments
CREATE POLICY "Admins can update salary payments"
    ON public.daily_salary_payments FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Admins can delete salary payments
CREATE POLICY "Admins can delete salary payments"
    ON public.daily_salary_payments FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- ORDER_RATINGS POLICIES
-- =====================================================

-- Anyone can view ratings (public)
CREATE POLICY "Anyone can view ratings"
    ON public.order_ratings FOR SELECT
    USING (true);

-- Anyone can insert ratings (public)
CREATE POLICY "Anyone can insert ratings"
    ON public.order_ratings FOR INSERT
    WITH CHECK (true);

-- Admins can update ratings
CREATE POLICY "Admins can update ratings"
    ON public.order_ratings FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Admins can delete ratings
CREATE POLICY "Admins can delete ratings"
    ON public.order_ratings FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- RATING_LIKES POLICIES
-- =====================================================

-- Anyone can view likes (public)
CREATE POLICY "Anyone can view likes"
    ON public.rating_likes FOR SELECT
    USING (true);

-- Authenticated users can insert likes
CREATE POLICY "Authenticated users can insert likes"
    ON public.rating_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
    ON public.rating_likes FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- PROMOS POLICIES
-- =====================================================

-- Anyone can view active promos (public)
CREATE POLICY "Anyone can view promos"
    ON public.promos FOR SELECT
    USING (true);

-- Only admins can insert promos
CREATE POLICY "Admins can insert promos"
    ON public.promos FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update promos
CREATE POLICY "Admins can update promos"
    ON public.promos FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Only admins can delete promos
CREATE POLICY "Admins can delete promos"
    ON public.promos FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- BRANCHES POLICIES
-- =====================================================

-- Anyone can view active branches (public)
CREATE POLICY "Anyone can view active branches"
    ON public.branches FOR SELECT
    USING (is_active = true OR public.is_admin(auth.uid()));

-- Only admins can insert branches
CREATE POLICY "Admins can insert branches"
    ON public.branches FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update branches
CREATE POLICY "Admins can update branches"
    ON public.branches FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Only admins can delete branches
CREATE POLICY "Admins can delete branches"
    ON public.branches FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- ELECTRICITY_READINGS POLICIES
-- =====================================================

-- Only admins can view electricity readings
CREATE POLICY "Admins can view electricity readings"
    ON public.electricity_readings FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Only admins can insert electricity readings
CREATE POLICY "Admins can insert electricity readings"
    ON public.electricity_readings FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update electricity readings
CREATE POLICY "Admins can update electricity readings"
    ON public.electricity_readings FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Only admins can delete electricity readings
CREATE POLICY "Admins can delete electricity readings"
    ON public.electricity_readings FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- SERVICE_RATES POLICIES
-- =====================================================

-- Anyone can view active service rates (public)
CREATE POLICY "Anyone can view active service rates"
    ON public.service_rates FOR SELECT
    USING (is_active = true OR public.is_admin(auth.uid()));

-- Only admins can insert service rates
CREATE POLICY "Admins can insert service rates"
    ON public.service_rates FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update service rates
CREATE POLICY "Admins can update service rates"
    ON public.service_rates FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Only admins can delete service rates
CREATE POLICY "Admins can delete service rates"
    ON public.service_rates FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- BANK_SAVINGS POLICIES
-- =====================================================

-- Only admins can view bank savings
CREATE POLICY "Admins can view bank savings"
    ON public.bank_savings FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Only admins can insert bank savings
CREATE POLICY "Admins can insert bank savings"
    ON public.bank_savings FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update bank savings
CREATE POLICY "Admins can update bank savings"
    ON public.bank_savings FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Only admins can delete bank savings
CREATE POLICY "Admins can delete bank savings"
    ON public.bank_savings FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- NET_INCOME_DISTRIBUTIONS POLICIES
-- =====================================================

-- Only admins can view distributions
CREATE POLICY "Admins can view distributions"
    ON public.net_income_distributions FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Only admins can insert distributions
CREATE POLICY "Admins can insert distributions"
    ON public.net_income_distributions FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update distributions
CREATE POLICY "Admins can update distributions"
    ON public.net_income_distributions FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Only admins can delete distributions
CREATE POLICY "Admins can delete distributions"
    ON public.net_income_distributions FOR DELETE
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- INITIAL DATA (Optional - for testing)
-- =====================================================

-- Insert default service rates (if table is empty)
INSERT INTO public.service_rates (name, price, type, is_active)
SELECT 'Wash, Dry, Fold (per 7.5kg load)', 180.00, 'service', true
WHERE NOT EXISTS (SELECT 1 FROM public.service_rates);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Make sure to set up Supabase Auth with email/password
-- 2. After creating tables, run this SQL in Supabase SQL Editor
-- 3. Update environment variables in your .env.local:
--    - NEXT_PUBLIC_SUPABASE_URL
--    - NEXT_PUBLIC_SUPABASE_ANON_KEY
--    - SUPABASE_SERVICE_ROLE_KEY
-- 4. Create your first admin user by:
--    a. Signing up through the app
--    b. Running: UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- 5. The schema uses UUID for most IDs except orders (which use TEXT like RKR000001)
-- 6. JSONB columns are used for arrays (assigned_employee_ids, load_pieces, found_items, load_completion)
-- 7. All timestamps use TIMESTAMPTZ (timezone-aware)
-- 8. RLS policies ensure data security at the database level
