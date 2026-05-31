CREATE TABLE IF NOT EXISTS unlocked_numerology_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  unlocked_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  nickname TEXT,
  gender TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
