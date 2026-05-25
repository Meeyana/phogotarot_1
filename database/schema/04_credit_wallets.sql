CREATE TABLE IF NOT EXISTS credit_wallets (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0, -- Số lượt/credits hiện có
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
