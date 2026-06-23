-- Track which user questions consumed paid access.
-- In SQLite/D1, run each ALTER separately if the console does not accept a batch.

ALTER TABLE credit_transactions ADD COLUMN credit_source TEXT;
ALTER TABLE credit_transactions ADD COLUMN feature TEXT;
ALTER TABLE credit_transactions ADD COLUMN reference_id TEXT;
ALTER TABLE credit_transactions ADD COLUMN question TEXT;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_paid_questions
ON credit_transactions(credit_source, feature, created_at);

DROP VIEW IF EXISTS paid_question_logs;
CREATE VIEW IF NOT EXISTS paid_question_logs AS
SELECT
  id,
  created_at,
  wallet_id AS user_id,
  feature,
  transaction_type,
  amount,
  reference_id,
  question,
  description
FROM credit_transactions
WHERE credit_source = 'paid'
  AND transaction_type IN ('usage_tarot', 'usage_yesno')
  AND question IS NOT NULL
  AND TRIM(question) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM credit_transactions refunds
    WHERE refunds.transaction_type = 'refund'
      AND refunds.credit_source = 'paid'
      AND refunds.wallet_id = credit_transactions.wallet_id
      AND refunds.feature = credit_transactions.feature
      AND refunds.reference_id = credit_transactions.reference_id
  );
