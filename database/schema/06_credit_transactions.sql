CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY, 
    wallet_id TEXT NOT NULL, -- Tương đương với user_id
    payment_transaction_id TEXT, -- Link với giao dịch nạp tiền nếu có (nullable)
    amount INTEGER NOT NULL, -- Số lượng credit: Dương (nạp), Âm (trừ đi)
    transaction_type TEXT NOT NULL, -- 'purchase', 'bonus', 'usage_tarot', 'refund'
    description TEXT, -- Mô tả chi tiết (vd: 'Mua gói 10 lượt', 'Bốc bài cho session xyz')
    credit_source TEXT, -- 'free' nếu trừ daily_credits, 'paid' nếu trừ credit mua hoặc dùng premium
    feature TEXT, -- Tính năng phát sinh giao dịch: tarot_reading, yes_no, tarot_chat_10...
    reference_id TEXT, -- ID phiên/reading liên quan để đối soát
    question TEXT, -- Snapshot câu hỏi tại thời điểm phát sinh giao dịch
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES credit_wallets(user_id) ON DELETE CASCADE,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL
);
