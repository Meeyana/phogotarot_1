CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    list_price INTEGER,
    sale_price INTEGER,
    sale_starts_at TEXT,
    sale_ends_at TEXT,
    credits INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'pack' (gói lẻ), 'subscription' (gói tháng/năm)
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chèn dữ liệu 5 gói cước hiện tại vào bảng
INSERT INTO packages (id, name, price, original_price, list_price, sale_price, credits, type)
VALUES 
    ('Khởi Đầu (3 lượt)', 'Gói Khởi Đầu', 49000, 69000, 69000, 49000, 3, 'pack'),
    ('Đồng Hành (10 lượt)', 'Gói Đồng Hành', 129000, 150000, 150000, 129000, 10, 'pack'),
    ('Vương Giả (Gói Tháng)', 'Vương Giả (Gói Tháng)', 199000, 250000, 250000, 199000, -1, 'subscription'),
    ('Chuyên Gia (Gói Năm)', 'Chuyên Gia (Gói Năm)', 599000, 800000, 800000, 599000, -1, 'subscription'),
    ('Khai Sáng (Trọn Đời)', 'Khai Sáng (Trọn Đời)', 799000, 1200000, 1200000, 799000, -1, 'subscription')
ON CONFLICT(id) DO NOTHING;
