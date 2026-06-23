-- Toggle sale countdown visibility without disabling sale pricing.
-- Run this once in D1. If the column already exists, skip the ALTER.

ALTER TABLE packages ADD COLUMN show_countdown INTEGER DEFAULT 1;

UPDATE packages
SET show_countdown = 1
WHERE show_countdown IS NULL;
