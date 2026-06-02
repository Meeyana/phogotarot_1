-- 1. Trigger cho bảng users
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 2. Trigger cho bảng user_profiles
CREATE TRIGGER IF NOT EXISTS update_user_profiles_updated_at
AFTER UPDATE ON user_profiles
FOR EACH ROW
BEGIN
    UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;

-- 3. Trigger cho bảng credit_wallets
CREATE TRIGGER IF NOT EXISTS update_credit_wallets_updated_at
AFTER UPDATE ON credit_wallets
FOR EACH ROW
BEGIN
    UPDATE credit_wallets SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;

-- 4. Trigger cho bảng conversations
CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at
AFTER UPDATE ON conversations
FOR EACH ROW
BEGIN
    UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 5. Trigger cho bảng payment_requests
CREATE TRIGGER IF NOT EXISTS update_payment_requests_updated_at
AFTER UPDATE ON payment_requests
FOR EACH ROW
BEGIN
    UPDATE payment_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 6. Trigger cho bảng tarot_database
CREATE TRIGGER IF NOT EXISTS update_tarot_database_updated_at
AFTER UPDATE ON tarot_database
FOR EACH ROW
BEGIN
    UPDATE tarot_database SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
