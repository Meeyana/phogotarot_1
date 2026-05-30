CREATE TABLE yes_no_readings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT,
    question TEXT,
    cards_payload TEXT,
    yes_no_result TEXT,
    interpretation TEXT,
    model TEXT,
    tokens_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
