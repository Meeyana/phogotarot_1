CREATE TABLE IF NOT EXISTS tarot_readings (
    id TEXT PRIMARY KEY, 
    conversation_id TEXT NOT NULL UNIQUE, -- 1 lần bốc bài cho 1 session hỏi đáp
    question TEXT NOT NULL,
    cards_payload TEXT NOT NULL, -- Dữ liệu mảng JSON các lá bài đã bốc
    spread_type TEXT DEFAULT 'single_card', -- Loại trải bài (1 lá, 3 lá...)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
