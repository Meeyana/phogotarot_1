-- Cập nhật bảng credit_wallets cho mô hình Hybrid
ALTER TABLE credit_wallets ADD COLUMN daily_credits INTEGER DEFAULT 1;
ALTER TABLE credit_wallets ADD COLUMN last_daily_reset DATE;
ALTER TABLE credit_wallets ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE credit_wallets ADD COLUMN subscription_expires_at DATETIME;

-- Khởi tạo last_daily_reset cho các record cũ để khỏi bị null
UPDATE credit_wallets SET last_daily_reset = CURRENT_DATE WHERE last_daily_reset IS NULL;
UPDATE credit_wallets SET daily_credits = 1 WHERE daily_credits IS NULL;
UPDATE credit_wallets SET subscription_tier = 'free' WHERE subscription_tier IS NULL;
