CREATE TABLE IF NOT EXISTS tarot_database (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_name TEXT UNIQUE NOT NULL,       -- Tên lá bài (ví dụ: 'Ace of Cups')
    upright_meaning TEXT NOT NULL,        -- Ý nghĩa chiều xuôi
    reversed_meaning TEXT NOT NULL,       -- Ý nghĩa chiều ngược
    yes_no_meaning TEXT,                  -- Ý nghĩa Yes/No đặc thù
    image_description TEXT,               -- Hình ảnh minh họa và ẩn dụ
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dành cho trường hợp bảng đã được tạo trước đó:
-- (Bỏ comment dòng dưới để chạy lệnh thêm cột nếu bảng đã tồn tại và chưa có cột image_description)
-- ALTER TABLE tarot_database ADD COLUMN image_description TEXT;
