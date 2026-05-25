CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY, 
    user_id TEXT NOT NULL,
    title TEXT, -- Tóm tắt ngắn gọn nếu cần
    status TEXT DEFAULT 'active', -- 'active', 'archived'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
