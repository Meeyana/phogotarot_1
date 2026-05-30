const fs = require('fs');
let p = 'd:/Tuan/phogotarot/src/pages/api/yesno-interpret.ts';
let content = fs.readFileSync(p, 'utf8');

// Replace the saving logic
const targetLogic = `        // 2. Lưu Conversation
        const title = question ? (question.length > 50 ? question.substring(0, 50) + '...' : question) : 'Trải bài Yes/No';
        await db.prepare(\`INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)\`).bind(safeReadingId, safeUserId, title).run();
        
        // 3. Lưu Tarot Reading
        const cardsPayload = JSON.stringify(cards || []);
        await db.prepare(\`INSERT OR IGNORE INTO tarot_readings (id, conversation_id, question, cards_payload, spread_type) VALUES (?, ?, ?, ?, ?)\`).bind(crypto.randomUUID(), safeReadingId, question || '', cardsPayload, 'yes_no').run();
        
        // 4. Lưu Message Logs
        if (question) {
           await db.prepare(\`INSERT INTO message_logs (conversation_id, role, content) VALUES (?, 'user', ?)\`).bind(safeReadingId, question).run();
        }
        
        const actualModel = data.model || body.validationModel || 'n8n_agent';
        let dbInterpretation = data.interpretation;
        if (cards && cards.length > 0) {
            dbInterpretation = \`<!-- CARDS_PAYLOAD: \${JSON.stringify(cards)} -->\\n\` + dbInterpretation;
        }

        await db.prepare(\`INSERT INTO message_logs (conversation_id, role, content, model) VALUES (?, 'assistant', ?, ?)\`).bind(safeReadingId, dbInterpretation, actualModel).run();`;

const newLogic = `        // 2. Lưu trực tiếp vào bảng yes_no_readings mới tạo
        const cardsPayload = JSON.stringify(cards || []);
        const actualModel = data.model || body.validationModel || 'n8n_agent';
        
        // Đếm tổng token nếu có trả về từ N8N (usage)
        let tokensUsed = 0;
        if (data.usage && data.usage.total_tokens) {
            tokensUsed = data.usage.total_tokens;
        }

        // Tự động phân loại Yes/No/Maybe từ phần luận giải (tạm thời)
        let yesNoResult = 'Unknown';
        const interLower = (data.interpretation || '').toLowerCase();
        if (interLower.includes('có') || interLower.includes('thành công') || interLower.includes('thuận lợi')) {
            yesNoResult = 'Có khả năng cao';
        }

        await db.prepare(\`
            INSERT INTO yes_no_readings (id, user_id, session_id, question, cards_payload, yes_no_result, interpretation, model, tokens_used) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        \`).bind(
            crypto.randomUUID(), 
            safeUserId, 
            safeReadingId,
            question || '', 
            cardsPayload,
            yesNoResult,
            data.interpretation || '',
            actualModel,
            tokensUsed
        ).run();`;

if (content.includes('// 2. Lưu Conversation')) {
    content = content.replace(targetLogic, newLogic);
    fs.writeFileSync(p, content);
    console.log('Patched yesno-interpret.ts');
} else {
    console.log('Could not find target logic');
}
