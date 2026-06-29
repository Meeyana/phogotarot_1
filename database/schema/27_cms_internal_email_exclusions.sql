-- Exclude internal/test accounts from CMS overview analytics and feeds.

CREATE TABLE IF NOT EXISTS cms_overview_excluded_emails (
  email TEXT PRIMARY KEY
);

INSERT INTO cms_overview_excluded_emails(email) VALUES
  ('tuanphan1112.working@gmail.com'),
  ('phandinhtuan1112@gmail.com'),
  ('bebluetotrue@gmail.com')
ON CONFLICT(email) DO NOTHING;

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
WHEN NOT EXISTS (
  SELECT 1
  FROM conversations c
  JOIN users u ON u.id = c.user_id
  JOIN cms_overview_excluded_emails e ON e.email = u.email
  WHERE c.id = NEW.conversation_id
)
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', COALESCE(NEW.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value + COALESCE(NEW.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_message_logs_update
AFTER UPDATE OF total_tokens ON message_logs
WHEN NOT EXISTS (
  SELECT 1
  FROM conversations c
  JOIN users u ON u.id = c.user_id
  JOIN cms_overview_excluded_emails e ON e.email = u.email
  WHERE c.id = NEW.conversation_id
)
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', COALESCE(NEW.total_tokens, 0) - COALESCE(OLD.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value + COALESCE(NEW.total_tokens, 0) - COALESCE(OLD.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_message_logs_delete
AFTER DELETE ON message_logs
WHEN NOT EXISTS (
  SELECT 1
  FROM conversations c
  JOIN users u ON u.id = c.user_id
  JOIN cms_overview_excluded_emails e ON e.email = u.email
  WHERE c.id = OLD.conversation_id
)
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', -COALESCE(OLD.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value - COALESCE(OLD.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_yes_no_insert
AFTER INSERT ON yes_no_readings
WHEN NOT EXISTS (
  SELECT 1
  FROM users u
  JOIN cms_overview_excluded_emails e ON e.email = u.email
  WHERE u.id = NEW.user_id
)
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', COALESCE(NEW.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value + COALESCE(NEW.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_yes_no_update
AFTER UPDATE OF total_tokens ON yes_no_readings
WHEN NOT EXISTS (
  SELECT 1
  FROM users u
  JOIN cms_overview_excluded_emails e ON e.email = u.email
  WHERE u.id = NEW.user_id
)
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', COALESCE(NEW.total_tokens, 0) - COALESCE(OLD.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value + COALESCE(NEW.total_tokens, 0) - COALESCE(OLD.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_yes_no_delete
AFTER DELETE ON yes_no_readings
WHEN NOT EXISTS (
  SELECT 1
  FROM users u
  JOIN cms_overview_excluded_emails e ON e.email = u.email
  WHERE u.id = OLD.user_id
)
BEGIN
  INSERT INTO cms_overview_stats(stat_key, value)
  VALUES ('tokens_burned', -COALESCE(OLD.total_tokens, 0))
  ON CONFLICT(stat_key) DO UPDATE SET value = value - COALESCE(OLD.total_tokens, 0);
END;

CREATE TRIGGER cms_overview_payment_insert
AFTER INSERT ON payment_requests
WHEN NEW.status = 'paid'
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE u.id = NEW.user_id
  )
BEGIN
  INSERT INTO cms_overview_revenue_monthly(month, total)
  VALUES (strftime('%Y-%m', datetime(NEW.created_at, '+7 hours')), COALESCE(NEW.amount, 0))
  ON CONFLICT(month) DO UPDATE SET total = total + COALESCE(NEW.amount, 0);
END;

CREATE TRIGGER cms_overview_payment_update_old
AFTER UPDATE ON payment_requests
WHEN OLD.status = 'paid'
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE u.id = OLD.user_id
  )
BEGIN
  INSERT INTO cms_overview_revenue_monthly(month, total)
  VALUES (strftime('%Y-%m', datetime(OLD.created_at, '+7 hours')), -COALESCE(OLD.amount, 0))
  ON CONFLICT(month) DO UPDATE SET total = total - COALESCE(OLD.amount, 0);
END;

CREATE TRIGGER cms_overview_payment_update_new
AFTER UPDATE ON payment_requests
WHEN NEW.status = 'paid'
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE u.id = NEW.user_id
  )
BEGIN
  INSERT INTO cms_overview_revenue_monthly(month, total)
  VALUES (strftime('%Y-%m', datetime(NEW.created_at, '+7 hours')), COALESCE(NEW.amount, 0))
  ON CONFLICT(month) DO UPDATE SET total = total + COALESCE(NEW.amount, 0);
END;

CREATE TRIGGER cms_overview_payment_delete
AFTER DELETE ON payment_requests
WHEN OLD.status = 'paid'
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE u.id = OLD.user_id
  )
BEGIN
  INSERT INTO cms_overview_revenue_monthly(month, total)
  VALUES (strftime('%Y-%m', datetime(OLD.created_at, '+7 hours')), -COALESCE(OLD.amount, 0))
  ON CONFLICT(month) DO UPDATE SET total = total - COALESCE(OLD.amount, 0);
END;

CREATE TRIGGER cms_overview_credit_insert
AFTER INSERT ON credit_transactions
WHEN (NEW.amount < 0 OR NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY'))
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE u.id = NEW.wallet_id
  )
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
WHEN (OLD.amount < 0 OR OLD.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY'))
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE u.id = OLD.wallet_id
  )
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
      SELECT MIN(c.created_at)
      FROM credit_transactions c
      JOIN users u ON u.id = c.wallet_id
      LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
      WHERE c.wallet_id = OLD.wallet_id
        AND c.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
        AND c.id <> OLD.id
        AND e.email IS NULL
    ),
    last_used_at = (
      SELECT MAX(c.created_at)
      FROM credit_transactions c
      JOIN users u ON u.id = c.wallet_id
      LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
      WHERE c.wallet_id = OLD.wallet_id
        AND c.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
        AND c.id <> OLD.id
        AND e.email IS NULL
    )
  WHERE wallet_id = OLD.wallet_id;
END;

CREATE TRIGGER cms_overview_credit_update_new
AFTER UPDATE ON credit_transactions
WHEN (NEW.amount < 0 OR NEW.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY'))
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE u.id = NEW.wallet_id
  )
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
WHEN (OLD.amount < 0 OR OLD.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY'))
  AND NOT EXISTS (
    SELECT 1
    FROM users u
    JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE u.id = OLD.wallet_id
  )
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
      SELECT MIN(c.created_at)
      FROM credit_transactions c
      JOIN users u ON u.id = c.wallet_id
      LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
      WHERE c.wallet_id = OLD.wallet_id
        AND c.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
        AND e.email IS NULL
    ),
    last_used_at = (
      SELECT MAX(c.created_at)
      FROM credit_transactions c
      JOIN users u ON u.id = c.wallet_id
      LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
      WHERE c.wallet_id = OLD.wallet_id
        AND c.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
        AND e.email IS NULL
    )
  WHERE wallet_id = OLD.wallet_id;
END;

DELETE FROM cms_overview_stats;
DELETE FROM cms_overview_revenue_monthly;
DELETE FROM cms_overview_credit_usage_monthly;
DELETE FROM cms_overview_user_credit_usage;

INSERT INTO cms_overview_stats(stat_key, value)
SELECT
  'tokens_burned',
  (
    SELECT COALESCE(SUM(m.total_tokens), 0)
    FROM message_logs m
    JOIN conversations c ON c.id = m.conversation_id
    JOIN users u ON u.id = c.user_id
    LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE e.email IS NULL
  )
  + (
    SELECT COALESCE(SUM(y.total_tokens), 0)
    FROM yes_no_readings y
    JOIN users u ON u.id = y.user_id
    LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
    WHERE e.email IS NULL
  );

INSERT INTO cms_overview_revenue_monthly(month, total)
SELECT
  strftime('%Y-%m', datetime(p.created_at, '+7 hours')) AS month,
  COALESCE(SUM(p.amount), 0) AS total
FROM payment_requests p
JOIN users u ON u.id = p.user_id
LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
WHERE p.status = 'paid'
  AND e.email IS NULL
GROUP BY month;

INSERT INTO cms_overview_credit_usage_monthly(transaction_type, month, total)
SELECT
  c.transaction_type,
  strftime('%Y-%m', datetime(c.created_at, '+7 hours')) AS month,
  -SUM(c.amount) AS total
FROM credit_transactions c
JOIN users u ON u.id = c.wallet_id
LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
WHERE c.amount < 0
  AND e.email IS NULL
GROUP BY c.transaction_type, month;

INSERT INTO cms_overview_user_credit_usage(wallet_id, total_spent, free_spent, usage_count, first_used_at, last_used_at)
SELECT
  c.wallet_id,
  SUM(CASE WHEN c.amount < 0 THEN -c.amount ELSE 0 END) AS total_spent,
  SUM(CASE WHEN c.credit_source = 'free' AND c.amount < 0 THEN -c.amount ELSE 0 END) AS free_spent,
  SUM(CASE WHEN c.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN 1 ELSE 0 END) AS usage_count,
  MIN(CASE WHEN c.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN c.created_at ELSE NULL END) AS first_used_at,
  MAX(CASE WHEN c.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY') THEN c.created_at ELSE NULL END) AS last_used_at
FROM credit_transactions c
JOIN users u ON u.id = c.wallet_id
LEFT JOIN cms_overview_excluded_emails e ON e.email = u.email
WHERE (
    c.amount < 0
    OR c.transaction_type IN ('usage_tarot', 'usage_yesno', 'UNLOCK_NUMEROLOGY')
  )
  AND e.email IS NULL
GROUP BY c.wallet_id;

INSERT INTO cms_overview_meta(key, value)
VALUES ('overview_summary_version', 'summary_v3_exclude_internal')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
