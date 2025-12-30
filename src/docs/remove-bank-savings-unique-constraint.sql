-- Remove unique constraint to allow multiple deposits per period
-- This allows each deposit to be saved as a separate transaction in history

-- Drop the unique constraint
ALTER TABLE bank_savings 
DROP CONSTRAINT IF EXISTS bank_savings_period_start_period_end_period_type_key;

-- Note: The index can remain for query performance, but it won't enforce uniqueness
-- Multiple deposits for the same period can now be recorded as separate transactions
