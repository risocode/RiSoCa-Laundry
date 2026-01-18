-- Add claimed_amount to support partial claims per owner
ALTER TABLE income_distributions
ADD COLUMN claimed_amount numeric DEFAULT 0;
