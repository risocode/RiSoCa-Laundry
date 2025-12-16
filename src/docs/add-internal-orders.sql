-- Add order_type column to orders table
-- This distinguishes between customer orders and internal (owner's) orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'customer' CHECK (order_type IN ('customer', 'internal'));

-- Add assigned_employee_id column to orders table
-- This is optional - if an employee is assigned to an internal order, they get +30 bonus
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for faster queries on order_type
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);

-- Create index for faster queries on assigned_employee_id
CREATE INDEX IF NOT EXISTS idx_orders_assigned_employee ON orders(assigned_employee_id);

-- Update existing orders to have order_type = 'customer' (if not already set)
UPDATE orders SET order_type = 'customer' WHERE order_type IS NULL;

