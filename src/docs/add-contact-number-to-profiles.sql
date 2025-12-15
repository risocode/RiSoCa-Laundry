-- Add contact_number column to profiles table
-- This allows customers to save their contact number for faster order creation

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Add comment
COMMENT ON COLUMN public.profiles.contact_number IS 'Customer contact number for order notifications and faster checkout';

