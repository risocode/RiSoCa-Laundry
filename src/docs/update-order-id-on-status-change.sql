-- Function to update order ID when status changes to "Order Placed"
-- This handles updating the order ID and all foreign key references
-- Returns boolean to avoid 406 errors from void functions
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_order_id_on_placed(
  p_order_id TEXT,
  p_new_order_id TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solution: Create new order row with new ID, update foreign keys, then delete old row
  
  -- Step 1: Create a new order row with the new ID (copy of existing order)
  INSERT INTO orders (
    id, customer_id, branch_id, customer_name, contact_number,
    service_package, weight, loads, distance, delivery_option,
    status, total, is_paid, balance, created_at, updated_at,
    canceled_by, canceled_at, cancel_reason
  )
  SELECT 
    p_new_order_id, customer_id, branch_id, customer_name, contact_number,
    service_package, weight, loads, distance, delivery_option,
    status, total, is_paid, balance, created_at, NOW(),
    canceled_by, canceled_at, cancel_reason
  FROM orders
  WHERE id = p_order_id;
  
  -- If no rows were inserted, the order doesn't exist
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Step 2: Update order_status_history to point to new ID
  UPDATE order_status_history
  SET order_id = p_new_order_id
  WHERE order_id = p_order_id;
  
  -- Step 3: Update order_ratings to point to new ID (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_ratings') THEN
    UPDATE order_ratings
    SET order_id = p_new_order_id
    WHERE order_id = p_order_id;
  END IF;
  
  -- Step 4: Delete the old order row (foreign keys now point to new ID)
  DELETE FROM orders
  WHERE id = p_order_id;
  
  RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_order_id_on_placed(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_id_on_placed(TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION update_order_id_on_placed IS 'Updates order ID by creating new row with new ID, updating foreign keys, then deleting old row. Returns boolean to indicate success. This avoids foreign key constraint violations and 406 errors.';
