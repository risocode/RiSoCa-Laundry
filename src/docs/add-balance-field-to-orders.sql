-- Add balance field to orders table for tracking unpaid amounts
-- This field stores the remaining balance when a customer pays partially

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment to explain the field
COMMENT ON COLUMN public.orders.balance IS 'Remaining balance for unpaid or partially paid orders. 0.00 means fully paid.';

-- Update existing orders to set balance to 0 if they are paid, or total if unpaid
UPDATE public.orders
SET balance = CASE 
  WHEN is_paid = true THEN 0.00
  ELSE total
END
WHERE balance IS NULL;

-- Set default constraint
ALTER TABLE public.orders
ALTER COLUMN balance SET DEFAULT 0.00;

-- Add index for faster queries on unpaid orders
CREATE INDEX IF NOT EXISTS idx_orders_balance ON public.orders(balance) WHERE balance > 0;

