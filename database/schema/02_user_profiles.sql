CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    full_name TEXT,
    nickname TEXT,
    date_of_birth DATE,
    gender TEXT, -- Cách muốn được xưng hô
    location TEXT, -- Quốc gia/môi trường sống
    occupation TEXT, -- Nghề nghiệp
    relationship_status TEXT, -- Tình trạng quan hệ
    recent_events TEXT, -- Biến cố gần đây
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
