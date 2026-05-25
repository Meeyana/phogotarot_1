CREATE TABLE IF NOT EXISTS auth_providers (
    id TEXT PRIMARY KEY, 
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- vd: 'google', 'facebook', 'zalo'
    provider_user_id TEXT NOT NULL, -- ID trả về từ provider
    access_token TEXT,
    refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider, provider_user_id)
);
