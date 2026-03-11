-- Add currency support to bookies and users
-- Migration: add_currency_support

-- Add currency column to bookies table
ALTER TABLE bookies ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add preferred_currency to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD';

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- Seed initial exchange rates (base: USD)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
  -- USD conversions
  ('USD', 'USD', 1.000000),
  ('USD', 'EUR', 0.920000),
  ('USD', 'GBP', 0.790000),
  ('USD', 'NGN', 1550.000000),
  
  -- EUR conversions
  ('EUR', 'USD', 1.087000),
  ('EUR', 'EUR', 1.000000),
  ('EUR', 'GBP', 0.860000),
  ('EUR', 'NGN', 1685.000000),
  
  -- GBP conversions
  ('GBP', 'USD', 1.266000),
  ('GBP', 'EUR', 1.163000),
  ('GBP', 'GBP', 1.000000),
  ('GBP', 'NGN', 1962.000000),
  
  -- NGN conversions
  ('NGN', 'USD', 0.000645),
  ('NGN', 'EUR', 0.000594),
  ('NGN', 'GBP', 0.000510),
  ('NGN', 'NGN', 1.000000)
ON CONFLICT (from_currency, to_currency) DO UPDATE
  SET rate = EXCLUDED.rate, updated_at = NOW();

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);

-- Add comment
COMMENT ON TABLE exchange_rates IS 'Currency exchange rates for multi-currency support';
