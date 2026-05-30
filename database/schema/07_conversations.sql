CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY, 
    user_id TEXT NOT NULL,
    reader_id TEXT REFERENCES tarot_readers(id),
    title TEXT, -- Tóm tắt ngắn gọn nếu cần
    status TEXT DEFAULT 'active', -- 'active', 'archived'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);