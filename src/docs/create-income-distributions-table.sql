-- Create income_distributions table to track distribution claims
CREATE TABLE IF NOT EXISTS income_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly', 'custom')),
  net_income DECIMAL(10, 2) NOT NULL,
  total_revenue DECIMAL(10, 2) NOT NULL,
  total_expenses DECIMAL(10, 2) NOT NULL,
  owner_name TEXT NOT NULL CHECK (owner_name IN ('Racky', 'Karaya', 'Richard')),
  share_amount DECIMAL(10, 2) NOT NULL,
  personal_expenses DECIMAL(10, 2) DEFAULT 0,
  net_share DECIMAL(10, 2) NOT NULL,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for filtering by period and owner
CREATE INDEX IF NOT EXISTS idx_income_distributions_period 
ON income_distributions(period_start, period_end, period_type);

CREATE INDEX IF NOT EXISTS idx_income_distributions_owner 
ON income_distributions(owner_name, is_claimed);

-- Create index for claimed status
CREATE INDEX IF NOT EXISTS idx_income_distributions_claimed 
ON income_distributions(is_claimed) WHERE is_claimed = TRUE;

-- Enable RLS
ALTER TABLE income_distributions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view and manage distributions
CREATE POLICY "Admins can view all distributions"
  ON income_distributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert distributions"
  ON income_distributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update distributions"
  ON income_distributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete distributions"
  ON income_distributions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

