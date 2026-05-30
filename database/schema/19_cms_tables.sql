-- Bảng Bài Viết (Articles)
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,       -- Nội dung bài viết định dạng Markdown
    author TEXT DEFAULT 'Admin',
    is_published BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Nội dung Thần số học (Numerology Content)
-- Lưu trữ cấu trúc JSON tương đương với numerology-data.json hiện tại
CREATE TABLE IF NOT EXISTS numerology_content (
    category TEXT NOT NULL,       -- Ví dụ: 'lifePath', 'destiny', 'soul'
    key_id TEXT NOT NULL,         -- Ví dụ: '1', '2', '11', '33'
    data TEXT NOT NULL,           -- Chứa cục JSON data của con số đó
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category, key_id)
);
