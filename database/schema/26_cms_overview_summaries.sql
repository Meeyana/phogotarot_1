-- CMS overview summary tables.
-- These tables keep expensive dashboard metrics pre-aggregated so the CMS does
-- not scan large event/log tables every time the overview page loads.

CREATE TABLE IF NOT EXISTS cms_overview_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_overview_stats (
  stat_key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cms_overview_revenue_monthly (
  month TEXT PRIMARY KEY,
  total INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cms_overview_credit_usage_monthly (
  transaction_type TEXT NOT NULL,
  month TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (transaction_type, month)
);

CREATE TABLE IF NOT EXISTS cms_overview_user_credit_usage (
  wallet_id TEXT PRIMARY KEY,
  total_spent INTEGER NOT NULL DEFAULT 0,
  free_spent INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  first_used_at TEXT,
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_cms_overview_user_total_spent
  ON cms_overview_user_credit_usage(total_spent DESC);

CREATE INDEX IF NOT EXISTS idx_cms_overview_user_free_spent
  ON cms_overview_user_credit_usage(free_spent DESC);

CREATE INDEX IF NOT EXISTS idx_cms_overview_user_usage_count
  ON cms_overview_user_credit_usage(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_cms_overview_user_last_used_at
  ON cms_overview_user_credit_usage(last_used_at DESC);

DROP TRIGGER IF EXISTS cms_overview_message_logs_insert;
DROP TRIGGER IF EXISTS cms_overview_message_logs_update;
DROP TRIGGER IF EXISTS cms_overview_message_logs_delete;
DROP TRIGGER IF EXISTS cms_overview_yes_no_insert;
DROP TRIGGER IF EXISTS cms_overview_yes_no_update;
DROP TRIGGER IF EXISTS cms_overview_yes_no_delete;
DROP TRIGGER IF EXISTS cms_overview_payment_insert;
DROP TRIGGER IF EXISTS cms_overview_payment_update_old;
DROP TRIGGER IF EXISTS cms_overview_payment_update_new;
DROP TRIGGER IF EXISTS cms_overview_payment_delete;
DROP TRIGGER IF EXISTS cms_overview_credit_insert;
DROP TRIGGER IF EXISTS cms_overview_credit_update_old;
DROP TRIGGER IF EXISTS cms_overview_credit_update_new;
DROP TRIGGER IF EXISTS cms_overview_credit_delete;

CREATE TRIGGER cms_overview_message_logs_insert
AFTER INSERT ON message_logs
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', COALESCE(NEW.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value + COALESCE(NEW.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_message_logs_update
AFTER UPDATE OF total_tokens ON message_logs
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', COALESCE(NEW.total_tokens, 0) - COALESCE(OLD.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value + COALESCE(NEW.total_tokens, 0) - COALESCE(OLD.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_message_logs_delete
AFTER DELETE ON message_logs
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', -COALESCE(OLD.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value - COALESCE(OLD.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_yes_no_insert
AFTER INSERT ON yes_no_readings
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', COALESCE(NEW.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value + COALESCE(NEW.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_yes_no_update
AFTER UPDATE OF total_tokens ON yes_no_readings
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', COALESCE(NEW.total_tokens, 0) - COALESCE(OLD.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value + COALESCE(NEW.total_tokens, 0) - COALESCE(OLD.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_yes_no_delete
AFTER DELETE ON yes_no_readings
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', -COALESCE(OLD.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value - COALESCE(OLD.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_payment_insert
AFTER INSERT ON payment_requests
WHEN NEW.status = 'paid'
BEGIN
  INSERT INTO cms_overview_revenue_monthly(month, total)
  VALUES (strftime('%Y-%m', datetime(NEW.created_at, '+7 hours')), COALESCE(NEW.amount, 0))
  ON CONFLICT(month) DO UPDATE SET total = total + COALESCE(NEW.amount, 0);
END;

CREATE TRIGGER cms_overview_payment_update_old
AFTER UPDATE ON payment_requests
WHEN OLD.status = 'paid'
BEGIN
  INSERT INTO cms_overview_revenue_monthly(month, total)
  VALUES (strftime('%Y-%m', datetime(OLD.created_at, '+7 hours')), -COALESCE(OLD.amount, 0))
  ON CONFLICT(month) DO UPDATE SET total = total - COALESCE(OLD.amount, 0);
END;

CREATE TRIGGER cms_overview_payment_update_new
AFTER UPDATE ON payment_requests
WHEN NEW.status = 'paid'
BEGIN
  INSERT INTO cms_overview_revenue_monthly(month, total)
  VALUES (strftime('%Y-%m', datetime(NEW.created_at, '+7 hours')), COALESCE(NEW.amount, 0))
  ON CONFLICT(month) DO UPDATE SET total = total + COALESCE(NEW.amount, 0);
END;

CREATE TRIGGER cms_overview_payment_delete
AFTER DELETE ON payment_requests
WHEN OLD.status = 'paid'
BEGIN
  INSERT INTO cms_overview_revenue_monthly(month, total)
  VALUES (strftime('%Y-%m', datetime(OLD.created_at, '+7 hours')), -COALESCE(OLD.amount, 0))
  ON CONFLICT(month) DO UPDATE SET total = total - COALESCE(OLD.amount, 0);
END;

CREATE TRIGGER cms_overview_credit_insert
AFTER INSERT ON credit_transactions
WHEN NEW.amount < 0 OR NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
BEGIN
  INSERT INTO cms_overview_credit_usage_monthly(transaction_type, month, total)
  SELECT NEW.transaction_type, strftime('%Y-%m', datetime(NEW.created_at, '+7 hours')), -NEW.amount
  WHERE NEW.amount < 0
  ON CONFLICT(transaction_type, month) DO UPDATE SET total = total - NEW.amount;

  INSERT INTO cms_overview_user_credit_usage(wallet_id, total_spent, free_spent, usage_count, first_used_at, last_used_at)
  VALUES (
    NEW.wallet_id,
    CASE WHEN NEW.amount < 0 THEN -NEW.amount ELSE 0 END,
    CASE WHEN NEW.credit_source = 'free' AND NEW.amount < 0 THEN -NEW.amount ELSE 0 END,
    CASE WHEN NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN 1 ELSE 0 END,
    CASE WHEN NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN NEW.created_at ELSE NULL END,
    CASE WHEN NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN NEW.created_at ELSE NULL END
  )
  ON CONFLICT(wallet_id) DO UPDATE SET
    total_spent = total_spent + CASE WHEN NEW.amount < 0 THEN -NEW.amount ELSE 0 END,
    free_spent = free_spent + CASE WHEN NEW.credit_source = 'free' AND NEW.amount < 0 THEN -NEW.amount ELSE 0 END,
    usage_count = usage_count + CASE WHEN NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN 1 ELSE 0 END,
    first_used_at = CASE
      WHEN excluded.first_used_at IS NOT NULL AND (first_used_at IS NULL OR excluded.first_used_at < first_used_at) THEN excluded.first_used_at
      ELSE first_used_at
    END,
    last_used_at = CASE
      WHEN excluded.last_used_at IS NOT NULL AND (last_used_at IS NULL OR excluded.last_used_at > last_used_at) THEN excluded.last_used_at
      ELSE last_used_at
    END;
END;

CREATE TRIGGER cms_overview_credit_update_old
AFTER UPDATE ON credit_transactions
WHEN OLD.amount < 0 OR OLD.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
BEGIN
  INSERT INTO cms_overview_credit_usage_monthly(transaction_type, month, total)
  SELECT OLD.transaction_type, strftime('%Y-%m', datetime(OLD.created_at, '+7 hours')), OLD.amount
  WHERE OLD.amount < 0
  ON CONFLICT(transaction_type, month) DO UPDATE SET total = total + OLD.amount;

  INSERT INTO cms_overview_user_credit_usage(wallet_id, total_spent, free_spent, usage_count)
  VALUES (
    OLD.wallet_id,
    CASE WHEN OLD.amount < 0 THEN OLD.amount ELSE 0 END,
    CASE WHEN OLD.credit_source = 'free' AND OLD.amount < 0 THEN OLD.amount ELSE 0 END,
    CASE WHEN OLD.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN -1 ELSE 0 END
  )
  ON CONFLICT(wallet_id) DO UPDATE SET
    total_spent = total_spent + CASE WHEN OLD.amount < 0 THEN OLD.amount ELSE 0 END,
    free_spent = free_spent + CASE WHEN OLD.credit_source = 'free' AND OLD.amount < 0 THEN OLD.amount ELSE 0 END,
    usage_count = usage_count - CASE WHEN OLD.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN 1 ELSE 0 END;

  UPDATE cms_overview_user_credit_usage
  SET
    first_used_at = (
      SELECT MIN(created_at)
      FROM credit_transactions
      WHERE wallet_id = OLD.wallet_id
        AND transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
        AND id <> OLD.id
    ),
    last_used_at = (
      SELECT MAX(created_at)
      FROM credit_transactions
      WHERE wallet_id = OLD.wallet_id
        AND transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
        AND id <> OLD.id
    )
  WHERE wallet_id = OLD.wallet_id;
END;

CREATE TRIGGER cms_overview_credit_update_new
AFTER UPDATE ON credit_transactions
WHEN NEW.amount < 0 OR NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
BEGIN
  INSERT INTO cms_overview_credit_usage_monthly(transaction_type, month, total)
  SELECT NEW.transaction_type, strftime('%Y-%m', datetime(NEW.created_at, '+7 hours')), -NEW.amount
  WHERE NEW.amount < 0
  ON CONFLICT(transaction_type, month) DO UPDATE SET total = total - NEW.amount;

  INSERT INTO cms_overview_user_credit_usage(wallet_id, total_spent, free_spent, usage_count, first_used_at, last_used_at)
  VALUES (
    NEW.wallet_id,
    CASE WHEN NEW.amount < 0 THEN -NEW.amount ELSE 0 END,
    CASE WHEN NEW.credit_source = 'free' AND NEW.amount < 0 THEN -NEW.amount ELSE 0 END,
    CASE WHEN NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN 1 ELSE 0 END,
    CASE WHEN NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN NEW.created_at ELSE NULL END,
    CASE WHEN NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN NEW.created_at ELSE NULL END
  )
  ON CONFLICT(wallet_id) DO UPDATE SET
    total_spent = total_spent + CASE WHEN NEW.amount < 0 THEN -NEW.amount ELSE 0 END,
    free_spent = free_spent + CASE WHEN NEW.credit_source = 'free' AND NEW.amount < 0 THEN -NEW.amount ELSE 0 END,
    usage_count = usage_count + CASE WHEN NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN 1 ELSE 0 END,
    first_used_at = CASE
      WHEN excluded.first_used_at IS NOT NULL AND (first_used_at IS NULL OR excluded.first_used_at < first_used_at) THEN excluded.first_used_at
      ELSE first_used_at
    END,
    last_used_at = CASE
      WHEN excluded.last_used_at IS NOT NULL AND (last_used_at IS NULL OR excluded.last_used_at > last_used_at) THEN excluded.last_used_at
      ELSE last_used_at
    END;
END;

CREATE TRIGGER cms_overview_credit_delete
AFTER DELETE ON credit_transactions
WHEN OLD.amount < 0 OR OLD.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
BEGIN
  INSERT INTO cms_overview_credit_usage_monthly(transaction_type, month, total)
  SELECT OLD.transaction_type, strftime('%Y-%m', datetime(OLD.created_at, '+7 hours')), OLD.amount
  WHERE OLD.amount < 0
  ON CONFLICT(transaction_type, month) DO UPDATE SET total = total + OLD.amount;

  INSERT INTO cms_overview_user_credit_usage(wallet_id, total_spent, free_spent, usage_count)
  VALUES (
    OLD.wallet_id,
    CASE WHEN OLD.amount < 0 THEN OLD.amount ELSE 0 END,
    CASE WHEN OLD.credit_source = 'free' AND OLD.amount < 0 THEN OLD.amount ELSE 0 END,
    CASE WHEN OLD.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN -1 ELSE 0 END
  )
  ON CONFLICT(wallet_id) DO UPDATE SET
    total_spent = total_spent + CASE WHEN OLD.amount < 0 THEN OLD.amount ELSE 0 END,
    free_spent = free_spent + CASE WHEN OLD.credit_source = 'free' AND OLD.amount < 0 THEN OLD.amount ELSE 0 END,
    usage_count = usage_count - CASE WHEN OLD.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN 1 ELSE 0 END;

  UPDATE cms_overview_user_credit_usage
  SET
    first_used_at = (
      SELECT MIN(created_at)
      FROM credit_transactions
      WHERE wallet_id = OLD.wallet_id
        AND transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
    ),
    last_used_at = (
      SELECT MAX(created_at)
      FROM credit_transactions
      WHERE wallet_id = OLD.wallet_id
        AND transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
    )
  WHERE wallet_id = OLD.wallet_id;
END;

DELETE FROM cms_overview_stats
WHERE NOT EXISTS (
  SELECT 1 FROM cms_overview_meta
  WHERE key = 'overview_summary_version' AND value = 'summary_v2'
);

DELETE FROM cms_overview_revenue_monthly
WHERE NOT EXISTS (
  SELECT 1 FROM cms_overview_meta
  WHERE key = 'overview_summary_version' AND value = 'summary_v2'
);

DELETE FROM cms_overview_credit_usage_monthly
WHERE NOT EXISTS (
  SELECT 1 FROM cms_overview_meta
  WHERE key = 'overview_summary_version' AND value = 'summary_v2'
);

DELETE FROM cms_overview_user_credit_usage
WHERE NOT EXISTS (
  SELECT 1 FROM cms_overview_meta
  WHERE key = 'overview_summary_version' AND value = 'summary_v2'
);

INSERT INTO cms_overview_stats(stat_key, value)
SELECT
  'tokens_burned',
  (SELECT COALESCE(SUM(total_tokens), 0) FROM message_logs)
    + (SELECT COALESCE(SUM(total_tokens), 0) FROM yes_no_readings)
WHERE NOT EXISTS (
  SELECT 1 FROM cms_overview_meta
  WHERE key = 'overview_summary_version' AND value = 'summary_v2'
);

INSERT INTO cms_overview_revenue_monthly(month, total)
SELECT
  strftime('%Y-%m', datetime(created_at, '+7 hours')) AS month,
  COALESCE(SUM(amount), 0) AS total
FROM payment_requests
WHERE status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM cms_overview_meta
    WHERE key = 'overview_summary_version' AND value = 'summary_v2'
  )
GROUP BY month;

INSERT INTO cms_overview_credit_usage_monthly(transaction_type, month, total)
SELECT
  transaction_type,
  strftime('%Y-%m', datetime(created_at, '+7 hours')) AS month,
  -SUM(amount) AS total
FROM credit_transactions
WHERE amount < 0
  AND NOT EXISTS (
    SELECT 1 FROM cms_overview_meta
    WHERE key = 'overview_summary_version' AND value = 'summary_v2'
  )
GROUP BY transaction_type, month;

INSERT INTO cms_overview_user_credit_usage(wallet_id, total_spent, free_spent, usage_count, first_used_at, last_used_at)
SELECT
  wallet_id,
  SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) AS total_spent,
  SUM(CASE WHEN credit_source = 'free' AND amount < 0 THEN -amount ELSE 0 END) AS free_spent,
  SUM(CASE WHEN transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN 1 ELSE 0 END) AS usage_count,
  MIN(CASE WHEN transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN created_at ELSE NULL END) AS first_used_at,
  MAX(CASE WHEN transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN created_at ELSE NULL END) AS last_used_at
FROM credit_transactions
WHERE (
    amount < 0
    OR transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
  )
  AND NOT EXISTS (
    SELECT 1 FROM cms_overview_meta
    WHERE key = 'overview_summary_version' AND value = 'summary_v2'
  )
GROUP BY wallet_id;

INSERT INTO cms_overview_meta(key, value)
SELECT 'overview_summary_version', 'summary_v2'
WHERE NOT EXISTS (
  SELECT 1 FROM cms_overview_meta
  WHERE key = 'overview_summary_version' AND value = 'summary_v2'
)
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
