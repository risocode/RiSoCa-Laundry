-- Create promos table for managing promotional campaigns
CREATE TABLE IF NOT EXISTS promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  price_per_load DECIMAL(10, 2) NOT NULL,
  display_date TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create index for faster queries on active promos
CREATE INDEX IF NOT EXISTS idx_promos_active ON promos(is_active, start_date, end_date);

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_promos_dates ON promos(start_date, end_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_promos_updated_at
  BEFORE UPDATE ON promos
  FOR EACH ROW
  EXECUTE FUNCTION update_promos_updated_at();

-- RLS Policies
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage promos
CREATE POLICY "Admins can manage promos"
  ON promos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow everyone (including anonymous users) to read active promos
CREATE POLICY "Everyone can read active promos"
  ON promos
  FOR SELECT
  USING (is_active = true)
  WITH CHECK (true);

