-- Create bank_savings table to track savings allocations per period
CREATE TABLE IF NOT EXISTS bank_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly', 'custom')),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(period_start, period_end, period_type)
);

-- Create index for filtering by period
CREATE INDEX IF NOT EXISTS idx_bank_savings_period 
ON bank_savings(period_start, period_end, period_type);

-- Enable RLS
ALTER TABLE bank_savings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view and manage bank savings
CREATE POLICY "Admins can view all bank savings"
  ON bank_savings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert bank savings"
  ON bank_savings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update bank savings"
  ON bank_savings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete bank savings"
  ON bank_savings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

