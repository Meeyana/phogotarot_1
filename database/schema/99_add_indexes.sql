-- 1. Index cho bảng Users (Tăng tốc độ tìm kiếm khi Đăng nhập bằng Email)
-- Lưu ý: Nếu cột email đã có constraint UNIQUE thì SQLite tự động tạo index, 
-- nhưng tạo rõ ràng cũng không sao (sẽ báo tồn tại hoặc bị bỏ qua).
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Index cho bảng Sessions (Tăng tốc độ kiểm tra quyền đăng nhập ở MỌI trang)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 3. Index cho bảng Conversations (Tăng tốc khi load lịch sử chat của 1 user)
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- 4. Index cho bảng Credit Transactions (Tăng tốc độ load trang lịch sử Nạp/Tiêu credit)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_wallet_id ON credit_transactions(wallet_id);

-- 5. Index cho bảng OTP Codes (Tăng tốc độ kiểm tra OTP khi đăng ký)
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);

-- 6. Index cho bảng Payment Requests (Tăng tốc độ load lịch sử thanh toán)
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);

-- 7. Index cho bảng Yes/No Readings (Tăng tốc độ load lịch sử bốc bài Yes/No)
CREATE INDEX IF NOT EXISTS idx_yes_no_readings_user_id ON yes_no_readings(user_id);

-- 8. Index cho bảng Payment Transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);

-- 9. Index cho bảng Auth Providers
CREATE INDEX IF NOT EXISTS idx_auth_providers_user_id ON auth_providers(user_id);
