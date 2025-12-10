-- Fix: Allow order search by ID and name without RLS restrictions
-- This function allows anyone (logged in or not) to search for orders
-- by order ID and customer name, which is needed for the order status page

CREATE OR REPLACE FUNCTION search_order_by_id_and_name(
  p_order_id TEXT,
  p_customer_name TEXT
)
RETURNS TABLE (
  id TEXT,
  customer_id UUID,
  branch_id UUID,
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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  order_status_history JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_id,
    o.branch_id,
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
    o.created_at,
    o.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', osh.id,
            'order_id', osh.order_id,
            'status', osh.status,
            'note', osh.note,
            'created_at', osh.created_at
          )
        )
        FROM order_status_history osh
        WHERE osh.order_id = o.id
        ORDER BY osh.created_at ASC
      ),
      '[]'::jsonb
    ) as order_status_history
  FROM orders o
  WHERE o.id = p_order_id
    AND LOWER(o.customer_name) LIKE '%' || LOWER(TRIM(p_customer_name)) || '%';
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION search_order_by_id_and_name(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_order_by_id_and_name(TEXT, TEXT) TO anon;

-- Test the function (optional - remove this after testing)
-- SELECT * FROM search_order_by_id_and_name('RKR001', 'Karaya');

