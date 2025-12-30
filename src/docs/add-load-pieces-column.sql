-- Add load_pieces column to orders table
-- This column stores an array of piece counts, one per load
-- Format: [30, 25, 20] means Load 1: 30 pieces, Load 2: 25 pieces, Load 3: 20 pieces

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS load_pieces JSONB DEFAULT NULL;

-- Create index for efficient querying (GIN index for JSONB arrays)
CREATE INDEX IF NOT EXISTS idx_orders_load_pieces 
ON public.orders USING GIN (load_pieces);

-- Add comment to document the column
COMMENT ON COLUMN public.orders.load_pieces IS 'Array of piece counts per load. Format: [30, 25] means Load 1 has 30 pieces, Load 2 has 25 pieces. Nullable - existing orders may not have piece counts.';
