-- Add cancellation fields to orders table
-- Run this in Supabase SQL Editor

-- Add canceled_by column (can be 'customer', 'system', or NULL)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS canceled_by TEXT;

-- Add canceled_at timestamp
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Add cancel_reason text field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.canceled_by IS 'Who canceled the order: customer, system, or NULL if not canceled';
COMMENT ON COLUMN public.orders.canceled_at IS 'Timestamp when the order was canceled';
COMMENT ON COLUMN public.orders.cancel_reason IS 'Reason for cancellation (e.g., "Order not approved within 24 hours")';

