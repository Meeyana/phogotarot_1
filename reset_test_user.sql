-- Để reset một user bất kỳ, bạn hãy Find & Replace chuỗi 'c8435e31-5868-463f-998f-ade3226546eb' thành ID của user đó nhé!

-- 1. Xóa toàn bộ tin nhắn thuộc về các hội thoại của user
DELETE FROM message_logs 
WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = 'c8435e31-5868-463f-998f-ade3226546eb');

-- 2. Xóa toàn bộ các lượt bốc bài (Tarot Readings)
DELETE FROM tarot_readings 
WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = 'c8435e31-5868-463f-998f-ade3226546eb');

-- 3. Xóa toàn bộ các cuộc hội thoại (Conversations)
DELETE FROM conversations 
WHERE user_id = 'c8435e31-5868-463f-998f-ade3226546eb';

-- 4. Xóa luôn các phiên đăng nhập (buộc tải lại session nếu cần thiết)
DELETE FROM sessions 
WHERE user_id = 'c8435e31-5868-463f-998f-ade3226546eb';

-- 5. Xóa sạch "Chân dung năng lượng" và "Biến cố" đã lưu trong profile
UPDATE user_profiles 
SET recent_events = NULL, user_persona = NULL 
WHERE user_id = 'c8435e31-5868-463f-998f-ade3226546eb';

-- 6. Set lại số dư Balance thành 10 để thoải mái Test
UPDATE credit_wallets 
SET balance = 10, daily_credits = 1 
WHERE user_id = 'c8435e31-5868-463f-998f-ade3226546eb';
