-- Function to update order ID when status changes to "Order Placed"
-- This handles updating the order ID and all foreign key references
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_order_id_on_placed(
  p_order_id TEXT,
  p_new_order_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We need to update orders table first, but we can't because of foreign key constraints
  -- Solution: Use a temporary placeholder ID, then update to final ID
  
  -- Step 1: Update order_status_history to a temporary ID (that doesn't conflict)
  UPDATE order_status_history
  SET order_id = 'TEMP-UPDATE-' || p_order_id
  WHERE order_id = p_order_id;
  
  -- Step 2: Update order_ratings to temporary ID (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_ratings') THEN
    UPDATE order_ratings
    SET order_id = 'TEMP-UPDATE-' || p_order_id
    WHERE order_id = p_order_id;
  END IF;
  
  -- Step 3: Now update orders table (no foreign key violations since we moved references)
  UPDATE orders
  SET id = p_new_order_id
  WHERE id = p_order_id;
  
  -- Step 4: Update order_status_history to the new ID
  UPDATE order_status_history
  SET order_id = p_new_order_id
  WHERE order_id = 'TEMP-UPDATE-' || p_order_id;
  
  -- Step 5: Update order_ratings to the new ID (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_ratings') THEN
    UPDATE order_ratings
    SET order_id = p_new_order_id
    WHERE order_id = 'TEMP-UPDATE-' || p_order_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_order_id_on_placed(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_id_on_placed(TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION update_order_id_on_placed IS 'Updates order ID and all foreign key references when order status changes to Order Placed. Uses temporary placeholder to avoid foreign key constraint violations.';
