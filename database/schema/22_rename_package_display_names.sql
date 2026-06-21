-- Rename package ids/display names to the new pricing labels.
-- Existing payment_requests are updated first so FK references stay valid.

INSERT INTO packages (
  id, name, price, original_price, list_price, sale_price, sale_starts_at,
  sale_ends_at, credits, type, is_active, created_at
)
SELECT
  'Gói 3 Credit', 'Gói 3 Credit', price, original_price, list_price, sale_price,
  sale_starts_at, sale_ends_at, credits, type, is_active, created_at
FROM packages
WHERE id = 'Khởi Đầu (3 lượt)'
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  price = excluded.price,
  original_price = excluded.original_price,
  list_price = excluded.list_price,
  sale_price = excluded.sale_price,
  sale_starts_at = excluded.sale_starts_at,
  sale_ends_at = excluded.sale_ends_at,
  credits = excluded.credits,
  type = excluded.type,
  is_active = excluded.is_active;

INSERT INTO packages (
  id, name, price, original_price, list_price, sale_price, sale_starts_at,
  sale_ends_at, credits, type, is_active, created_at
)
SELECT
  'Gói 10 Credit', 'Gói 10 Credit', price, original_price, list_price, sale_price,
  sale_starts_at, sale_ends_at, credits, type, is_active, created_at
FROM packages
WHERE id = 'Đồng Hành (10 lượt)'
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  price = excluded.price,
  original_price = excluded.original_price,
  list_price = excluded.list_price,
  sale_price = excluded.sale_price,
  sale_starts_at = excluded.sale_starts_at,
  sale_ends_at = excluded.sale_ends_at,
  credits = excluded.credits,
  type = excluded.type,
  is_active = excluded.is_active;

INSERT INTO packages (
  id, name, price, original_price, list_price, sale_price, sale_starts_at,
  sale_ends_at, credits, type, is_active, created_at
)
SELECT
  'Gói Tháng', 'Gói Tháng', price, original_price, list_price, sale_price,
  sale_starts_at, sale_ends_at, credits, type, is_active, created_at
FROM packages
WHERE id = 'Vương Giả (Gói Tháng)'
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  price = excluded.price,
  original_price = excluded.original_price,
  list_price = excluded.list_price,
  sale_price = excluded.sale_price,
  sale_starts_at = excluded.sale_starts_at,
  sale_ends_at = excluded.sale_ends_at,
  credits = excluded.credits,
  type = excluded.type,
  is_active = excluded.is_active;

INSERT INTO packages (
  id, name, price, original_price, list_price, sale_price, sale_starts_at,
  sale_ends_at, credits, type, is_active, created_at
)
SELECT
  'Gói Năm', 'Gói Năm', price, original_price, list_price, sale_price,
  sale_starts_at, sale_ends_at, credits, type, is_active, created_at
FROM packages
WHERE id = 'Chuyên Gia (Gói Năm)'
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  price = excluded.price,
  original_price = excluded.original_price,
  list_price = excluded.list_price,
  sale_price = excluded.sale_price,
  sale_starts_at = excluded.sale_starts_at,
  sale_ends_at = excluded.sale_ends_at,
  credits = excluded.credits,
  type = excluded.type,
  is_active = excluded.is_active;

INSERT INTO packages (
  id, name, price, original_price, list_price, sale_price, sale_starts_at,
  sale_ends_at, credits, type, is_active, created_at
)
SELECT
  'Gói Trọn Đời', 'Gói Trọn Đời', price, original_price, list_price, sale_price,
  sale_starts_at, sale_ends_at, credits, type, is_active, created_at
FROM packages
WHERE id = 'Khai Sáng (Trọn Đời)'
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  price = excluded.price,
  original_price = excluded.original_price,
  list_price = excluded.list_price,
  sale_price = excluded.sale_price,
  sale_starts_at = excluded.sale_starts_at,
  sale_ends_at = excluded.sale_ends_at,
  credits = excluded.credits,
  type = excluded.type,
  is_active = excluded.is_active;

UPDATE payment_requests SET package_id = 'Gói 3 Credit' WHERE package_id = 'Khởi Đầu (3 lượt)';
UPDATE payment_requests SET package_id = 'Gói 10 Credit' WHERE package_id = 'Đồng Hành (10 lượt)';
UPDATE payment_requests SET package_id = 'Gói Tháng' WHERE package_id = 'Vương Giả (Gói Tháng)';
UPDATE payment_requests SET package_id = 'Gói Năm' WHERE package_id = 'Chuyên Gia (Gói Năm)';
UPDATE payment_requests SET package_id = 'Gói Trọn Đời' WHERE package_id = 'Khai Sáng (Trọn Đời)';

DELETE FROM packages WHERE id IN (
  'Khởi Đầu (3 lượt)',
  'Đồng Hành (10 lượt)',
  'Vương Giả (Gói Tháng)',
  'Chuyên Gia (Gói Năm)',
  'Khai Sáng (Trọn Đời)'
);
