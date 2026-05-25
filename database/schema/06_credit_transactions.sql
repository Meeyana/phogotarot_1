CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY, 
    wallet_id TEXT NOT NULL, -- Tương đương với user_id
    payment_transaction_id TEXT, -- Link với giao dịch nạp tiền nếu có (nullable)
    amount INTEGER NOT NULL, -- Số lượng credit: Dương (nạp), Âm (trừ đi)
    transaction_type TEXT NOT NULL, -- 'purchase', 'bonus', 'usage_tarot', 'refund'
    description TEXT, -- Mô tả chi tiết (vd: 'Mua gói 10 lượt', 'Bốc bài cho session xyz')
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES credit_wallets(user_id) ON DELETE CASCADE,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL
);
