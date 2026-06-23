-- Pricing fields for CMS-managed package pricing.
-- Run each ALTER separately in D1 if your console does not accept a batch.

ALTER TABLE packages ADD COLUMN list_price INTEGER;
ALTER TABLE packages ADD COLUMN sale_price INTEGER;
ALTER TABLE packages ADD COLUMN sale_starts_at TEXT;
ALTER TABLE packages ADD COLUMN sale_ends_at TEXT;
ALTER TABLE packages ADD COLUMN show_countdown INTEGER DEFAULT 1;

UPDATE packages
SET
  list_price = COALESCE(original_price, price),
  sale_price = CASE
    WHEN original_price IS NOT NULL AND original_price > price THEN price
    ELSE NULL
  END,
  show_countdown = COALESCE(show_countdown, 1)
WHERE list_price IS NULL OR show_countdown IS NULL;
