CREATE TABLE IF NOT EXISTS credit_wallets (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0, -- Số lượt/credits hiện có
    chat_count INTEGER DEFAULT 0,
    daily_credits INTEGER DEFAULT 1,
    last_daily_reset DATE,
    subscription_tier TEXT DEFAULT 'free',
    subscription_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (balance >= 0)
);