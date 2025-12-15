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
  -- Update all foreign key references BEFORE updating orders table
  -- This prevents foreign key constraint violations
  
  -- Update order_status_history
  UPDATE order_status_history
  SET order_id = p_new_order_id
  WHERE order_id = p_order_id;
  
  -- Update order_ratings (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_ratings') THEN
    UPDATE order_ratings
    SET order_id = p_new_order_id
    WHERE order_id = p_order_id;
  END IF;
  
  -- Update orders table last (after all foreign key references are updated)
  UPDATE orders
  SET id = p_new_order_id
  WHERE id = p_order_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_order_id_on_placed(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_id_on_placed(TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION update_order_id_on_placed IS 'Updates order ID and all foreign key references when order status changes to Order Placed';

