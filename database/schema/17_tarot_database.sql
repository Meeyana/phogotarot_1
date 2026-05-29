CREATE TABLE IF NOT EXISTS tarot_database (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_name TEXT UNIQUE NOT NULL,       -- Tên lá bài (ví dụ: 'Ace of Cups')
    upright_meaning TEXT NOT NULL,        -- Ý nghĩa chiều xuôi
    reversed_meaning TEXT NOT NULL,       -- Ý nghĩa chiều ngược
    yes_no_meaning TEXT,                  -- Ý nghĩa Yes/No đặc thù
    image_description TEXT,               -- Hình ảnh minh họa và ẩn dụ
    upright_keyword TEXT,
    reversed_keyword TEXT,
    upright_love_keyword TEXT,
    upright_career_keyword TEXT,
    upright_finances_keyword TEXT,
    reversed_love_keyword TEXT,
    reversed_career_keyword TEXT,
    reversed_finances_keyword TEXT,
    upright_love_meaning TEXT,
    upright_career_meaning TEXT,
    upright_finances_meaning TEXT,
    reversed_love_meaning TEXT,
    reversed_career_meaning TEXT,
    reversed_finances_meaning TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
