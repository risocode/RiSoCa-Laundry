-- Add found_items column to orders table
-- This column stores an array of items found in customer laundry
-- Format: ["wallet", "keys", "phone"] - simple array of item descriptions

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS found_items JSONB DEFAULT NULL;

-- Create index for efficient querying (GIN index for JSONB arrays)
CREATE INDEX IF NOT EXISTS idx_orders_found_items 
ON public.orders USING GIN (found_items);

-- Add comment to document the column
COMMENT ON COLUMN public.orders.found_items IS 'Array of items found in customer laundry. Format: ["wallet", "keys", "phone"]. Nullable - most orders will not have found items.';
