-- =================================================================
-- Quick Fix: Drop and Recreate Trigger
-- 
-- Run this if you're getting "trigger already exists" error
-- =================================================================

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;

-- Ensure the function exists
CREATE OR REPLACE FUNCTION set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_current_timestamp_updated_at();

