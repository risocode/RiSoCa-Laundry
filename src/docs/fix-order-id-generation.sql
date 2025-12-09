-- =================================================================
-- Fix for Order ID Generation Issue
-- 
-- Problem: fetchLatestOrderId() fails for regular customers because
-- RLS policies only allow them to see their own orders, but we need
-- to see ALL orders to get the latest ID for sequential numbering.
--
-- Solution: Create a SECURITY DEFINER function that can read the
-- latest order ID without RLS restrictions.
-- =================================================================

-- Create a function to get the latest order ID
-- This function bypasses RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_latest_order_id()
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_order_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_order_id() TO anon;

