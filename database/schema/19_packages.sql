CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    list_price INTEGER,
    sale_price INTEGER,
    sale_starts_at TEXT,
    sale_ends_at TEXT,
    show_countdown INTEGER DEFAULT 1,
    credits INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'pack' (gói lẻ), 'subscription' (gói tháng/năm)
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chèn dữ liệu 5 gói cước hiện tại vào bảng
INSERT INTO packages (id, name, price, original_price, list_price, sale_price, credits, type)
VALUES 
    ('Gói 3 Credit', 'Gói 3 Credit', 49000, 69000, 69000, 49000, 3, 'pack'),
    ('Gói 10 Credit', 'Gói 10 Credit', 129000, 150000, 150000, 129000, 10, 'pack'),
    ('Gói Tháng', 'Gói Tháng', 199000, 250000, 250000, 199000, -1, 'subscription'),
    ('Gói Năm', 'Gói Năm', 599000, 800000, 800000, 599000, -1, 'subscription'),
    ('Gói Trọn Đời', 'Gói Trọn Đời', 799000, 1200000, 1200000, 799000, -1, 'subscription')
ON CONFLICT(id) DO NOTHING;
