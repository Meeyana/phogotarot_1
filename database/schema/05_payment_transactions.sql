CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY, 
    user_id TEXT NOT NULL,
    amount REAL NOT NULL, -- Số tiền thanh toán
    currency TEXT DEFAULT 'VND',
    status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
    payment_gateway TEXT, -- 'momo', 'stripe', 'vnpay', 'zalopay'
    gateway_transaction_id TEXT, -- Mã giao dịch bên thứ 3
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
