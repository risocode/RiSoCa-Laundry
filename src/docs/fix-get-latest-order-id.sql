-- Update get_latest_order_id to only return RKR### format IDs
-- This ensures TEMP IDs are not used when generating new order IDs
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_latest_order_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  latest_id TEXT;
BEGIN
  -- Only get orders with RKR### format IDs, ignore TEMP IDs
  SELECT id INTO latest_id
  FROM orders
  WHERE id ~ '^RKR\d+$'  -- Only match RKR followed by digits
  ORDER BY 
    CAST(SUBSTRING(id FROM 'RKR(\d+)') AS INTEGER) DESC,  -- Extract number and sort numerically
    created_at DESC
  LIMIT 1;
  
  RETURN latest_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_latest_order_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_order_id() TO service_role;

COMMENT ON FUNCTION get_latest_order_id IS 'Returns the latest order ID in RKR### format. Ignores TEMP IDs to ensure proper sequential numbering.';

