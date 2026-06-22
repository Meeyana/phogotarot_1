-- CMS-managed popup/banner campaigns for the public website.

CREATE TABLE IF NOT EXISTS site_popups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  enabled INTEGER DEFAULT 0,
  title TEXT,
  body TEXT,
  image_url TEXT,
  cta_label TEXT,
  cta_url TEXT,
  display_delay_seconds INTEGER DEFAULT 5,
  display_frequency TEXT DEFAULT 'once_per_day',
  page_rules TEXT DEFAULT '{"mode":"all","paths":[]}',
  audience_rules TEXT DEFAULT '{"mode":"all"}',
  starts_at TEXT,
  ends_at TEXT,
  priority INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_popups_active
  ON site_popups (enabled, priority, updated_at);
