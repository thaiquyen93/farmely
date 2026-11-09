-- Persist admin-configured monthly price for the Farmely care package.
ALTER TABLE plots
  ADD COLUMN IF NOT EXISTS care_price_per_month NUMERIC(15, 2);

-- Keep the current public pricing behavior for existing plots (50% of rent)
-- until an admin chooses a different package price.
UPDATE plots
SET care_price_per_month = ROUND(price_per_period * 0.5, 2)
WHERE care_price_per_month IS NULL;

ALTER TABLE plots
  ALTER COLUMN care_price_per_month SET DEFAULT 0,
  ALTER COLUMN care_price_per_month SET NOT NULL;
