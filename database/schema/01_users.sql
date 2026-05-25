CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- UUID or auto-generated ID
    email TEXT UNIQUE,
    password_hash TEXT, -- Bỏ trống nếu login bằng Social
    status TEXT DEFAULT 'active', -- active, banned
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
