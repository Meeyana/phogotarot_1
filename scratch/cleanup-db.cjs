const fs = require('fs');

const dir = 'd:/Tuan/phogotarot/database/schema/';

// 1. Rewrite 04_credit_wallets.sql
const creditWallets = `CREATE TABLE IF NOT EXISTS credit_wallets (
    user_id TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0, -- Số lượt/credits hiện có
    chat_count INTEGER DEFAULT 0,
    daily_credits INTEGER DEFAULT 1,
    last_daily_reset DATE,
    subscription_tier TEXT DEFAULT 'free',
    subscription_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`;
fs.writeFileSync(dir + '04_credit_wallets.sql', creditWallets);

// 2. Rewrite 07_conversations.sql
const conversations = `CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY, 
    user_id TEXT NOT NULL,
    reader_id TEXT REFERENCES tarot_readers(id),
    title TEXT, -- Tóm tắt ngắn gọn nếu cần
    status TEXT DEFAULT 'active', -- 'active', 'archived'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`;
fs.writeFileSync(dir + '07_conversations.sql', conversations);

// 3. Rewrite 15_tarot_readers.sql
const tarotReaders = `CREATE TABLE IF NOT EXISTS tarot_readers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    system_prompt TEXT NOT NULL,
    self_pronoun TEXT,
    user_pronoun TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for Readers
INSERT INTO tarot_readers (id, name, description, avatar_url, system_prompt, self_pronoun, user_pronoun, is_active)
VALUES 
('witcher', 'Bà Phù Thủy', 'Kỳ bí, thẳng thắn, đôi khi đáng sợ nhưng luôn nói sự thật phũ phàng.', '/images/witcher-bot.jpg', 'Bạn là một bà phù thủy hắc ám, sống hàng trăm năm. Giọng điệu của bạn ma mị, sắc sảo, thường cảnh báo người xem về những góc khuất trong cuộc sống. Thường gọi người xem là "kẻ tò mò" hoặc "người trần mắt thịt".', 'ta', 'ngươi', TRUE),

('oracle', 'Nhà Tiên Tri', 'Điềm tĩnh, uyên bác, đưa ra lời khuyên một cách thông thái và nhẹ nhàng.', '/images/default-avatar.png', 'Bạn là một nhà tiên tri cổ đại đầy thông thái. Lời lẽ của bạn điềm tĩnh, ấm áp, uyển chuyển và luôn hướng con người ta đến ánh sáng. Bạn gọi người xem là "người lữ hành" hoặc "linh hồn".', 'ta', 'con', TRUE),

('friend', 'Người Bạn Thân', 'Gần gũi, chia sẻ như một người bạn thân, luôn thấu hiểu và đồng cảm.', '/images/default-avatar.png', 'Bạn giống như một người bạn thân thiết của người xem. Bạn xưng "mình" và "bạn", nói chuyện bằng ngôn ngữ hiện đại, gần gũi, thấu hiểu, mang lại cảm giác an ủi và tích cực.', 'mình', 'bạn', TRUE),

('harsh', 'Bà Đồng Phũ Phàng', 'Nói thẳng, không vòng vo, luôn xoáy sâu vào sự thật dù nó đau lòng.', '/images/default-avatar.png', 'Bạn là một người trải đời, rất thẳng thắn và có phần phũ phàng. Bạn không an ủi, không nói những lời đường mật. Sự thật là sự thật. Xưng hô "tôi" và "bạn" một cách lạnh lùng nhưng chân thực.', 'tôi', 'bạn', TRUE),

('mystic', 'Linh Hồn Huyền Bí', 'Sử dụng nhiều từ ngữ bay bổng, trừu tượng, đầy chất thơ và triết lý.', '/images/default-avatar.png', 'Bạn là một thực thể tâm linh phi giới tính, tồn tại giữa các vì sao. Lời lẽ của bạn đầy tính ẩn dụ, triết học, chất thơ, mang đến cảm giác rộng lớn và vô hạn. Bạn không trả lời trực tiếp mà gợi mở để người xem tự tìm ra chân lý.', 'ta', 'hỡi linh hồn', TRUE);
`;
fs.writeFileSync(dir + '15_tarot_readers.sql', tarotReaders);

// 4. Delete redundant files
const toDelete = [
    '12_add_chat_count.sql',
    '13_update_business_model.sql',
    '16_add_reader_to_conversations.sql',
    '18_add_detailed_meanings_to_tarot.sql'
];

toDelete.forEach(file => {
    if (fs.existsSync(dir + file)) {
        fs.unlinkSync(dir + file);
    }
});

console.log("Database schema cleaned up.");
