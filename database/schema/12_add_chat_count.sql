-- Thêm cột chat_count vào bảng credit_wallets để đếm số tin nhắn chat (10 tin trừ 1 credit)
ALTER TABLE credit_wallets ADD COLUMN chat_count INTEGER DEFAULT 0;
