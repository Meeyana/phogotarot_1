-- Thêm trường reader_id vào bảng conversations để lưu reader nào đang được dùng cho cuộc trò chuyện.
ALTER TABLE conversations ADD COLUMN reader_id TEXT REFERENCES tarot_readers(id);
