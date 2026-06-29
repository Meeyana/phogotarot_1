const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const root = path.resolve(__dirname, '..');
const d1Dir = path.join(root, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject');
const dbFile = fs.readdirSync(d1Dir).find((file) => file.endsWith('.sqlite'));

if (!dbFile) {
  throw new Error(`No local D1 sqlite file found in ${d1Dir}`);
}

const dbPath = path.join(d1Dir, dbFile);
const db = new sqlite3.Database(dbPath);

function run(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => (err ? reject(err) : resolve()));
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

function all(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

async function hasColumn(table, column) {
  const rows = await all(`PRAGMA table_info(${table})`);
  return rows.some((row) => row.name === column);
}

async function addColumnIfMissing(table, column, definition) {
  if (await hasColumn(table, column)) return false;
  await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
}

async function main() {
  const applied = [];

  for (const [column, definition] of [
    ['list_price', 'INTEGER'],
    ['sale_price', 'INTEGER'],
    ['sale_starts_at', 'TEXT'],
    ['sale_ends_at', 'TEXT'],
    ['show_countdown', 'INTEGER DEFAULT 1'],
  ]) {
    if (await addColumnIfMissing('packages', column, definition)) {
      applied.push(`packages.${column}`);
    }
  }

  await exec(`
    UPDATE packages
    SET
      list_price = COALESCE(list_price, original_price, price),
      sale_price = CASE
        WHEN sale_price IS NOT NULL THEN sale_price
        WHEN original_price IS NOT NULL AND original_price > price THEN price
        ELSE NULL
      END,
      show_countdown = COALESCE(show_countdown, 1)
    WHERE list_price IS NULL OR show_countdown IS NULL;
  `);

  await exec(fs.readFileSync(path.join(root, 'database', 'schema', '22_rename_package_display_names.sql'), 'utf8'));

  for (const [column, definition] of [
    ['credit_source', 'TEXT'],
    ['feature', 'TEXT'],
    ['reference_id', 'TEXT'],
    ['question', 'TEXT'],
  ]) {
    if (await addColumnIfMissing('credit_transactions', column, definition)) {
      applied.push(`credit_transactions.${column}`);
    }
  }

  await exec(`
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
  `);

  await exec(fs.readFileSync(path.join(root, 'database', 'schema', '26_cms_overview_summaries.sql'), 'utf8'));
  await exec(fs.readFileSync(path.join(root, 'database', 'schema', '27_cms_internal_email_exclusions.sql'), 'utf8'));
  await exec(fs.readFileSync(path.join(root, 'database', 'schema', '99_add_indexes.sql'), 'utf8'));

  const objects = await all(`
    SELECT name, type
    FROM sqlite_master
    WHERE name NOT LIKE 'sqlite_%'
    ORDER BY type, name
  `);

  console.log(`Local D1 synced: ${dbPath}`);
  if (applied.length) {
    console.log(`Added columns: ${applied.join(', ')}`);
  } else {
    console.log('No missing columns needed to be added.');
  }
  console.log(`Objects: ${objects.length}`);
}

main()
  .then(() => db.close())
  .catch((err) => {
    db.close();
    console.error(err);
    process.exit(1);
  });
