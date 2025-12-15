-- Background job to auto-cancel orders in "Order Created" status for 24+ hours
-- This should be set up as a scheduled job (cron) or Supabase Edge Function
-- Run this function periodically (e.g., every hour)

CREATE OR REPLACE FUNCTION auto_cancel_unapproved_orders()
RETURNS TABLE(
  canceled_count INTEGER,
  canceled_order_ids TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_canceled_count INTEGER := 0;
  v_canceled_ids TEXT[] := ARRAY[]::TEXT[];
  v_order_record RECORD;
BEGIN
  -- Find all orders in "Order Created" status that are 24+ hours old
  FOR v_order_record IN
    SELECT id, customer_id, created_at
    FROM orders
    WHERE status = 'Order Created'
      AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Update order to Canceled status
    UPDATE orders
    SET 
      status = 'Canceled',
      canceled_by = 'system',
      canceled_at = NOW(),
      cancel_reason = 'Order not approved within 24 hours'
    WHERE id = v_order_record.id;
    
    -- Add status history entry
    INSERT INTO order_status_history (order_id, status, note)
    VALUES (v_order_record.id, 'Canceled', 'Automatically canceled: Order not approved within 24 hours');
    
    -- Track canceled orders
    v_canceled_count := v_canceled_count + 1;
    v_canceled_ids := array_append(v_canceled_ids, v_order_record.id);
  END LOOP;
  
  RETURN QUERY SELECT v_canceled_count, v_canceled_ids;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_cancel_unapproved_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_cancel_unapproved_orders() TO service_role;

COMMENT ON FUNCTION auto_cancel_unapproved_orders IS 'Automatically cancels orders in "Order Created" status that are older than 24 hours. Should be run periodically via cron or Supabase Edge Function.';

-- Example: To run this function manually, execute:
-- SELECT * FROM auto_cancel_unapproved_orders();

