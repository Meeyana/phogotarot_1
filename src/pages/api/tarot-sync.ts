import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;
    
    if (!db) {
        return new Response(JSON.stringify({ error: 'Database config missing' }), { status: 500 });
    }

    const user = context.locals.user;
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { history, readingId } = body;
    if (!history || !readingId || !Array.isArray(history)) {
        return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    const safeUserId = user.id;

    // Kiểm tra xem conversation đã được tạo chưa
    const existingConv = await db.prepare('SELECT id FROM conversations WHERE id = ?').bind(readingId).first();
    
    if (!existingConv) {
        // Lấy câu hỏi đầu tiên làm title
        const firstUserMsg = history.find((msg: any) => msg.sender === 'user');
        const question = firstUserMsg ? firstUserMsg.text : 'Trải bài Tarot (Sync)';
        const title = question.length > 50 ? question.substring(0, 50) + '...' : question;

        // Tạo conversation
        await db.prepare(`INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)`).bind(readingId, safeUserId, "Trò chuyện: " + title).run();

        // Duyệt qua history và insert
        for (const msg of history) {
            const role = msg.sender === 'user' ? 'user' : 'assistant';
            
            // Nếu là bot và có cards -> lưu tarot_readings
            if (role === 'assistant' && msg.cards && Array.isArray(msg.cards) && msg.cards.length > 0) {
                const cardsPayload = JSON.stringify(msg.cards);
                // Giả định câu hỏi của Tarot reading này là câu hỏi user ngay trước đó
                const msgIndex = history.indexOf(msg);
                let readingQuestion = '';
                if (msgIndex > 0 && history[msgIndex - 1].sender === 'user') {
                    readingQuestion = history[msgIndex - 1].text;
                }
                
                await db.prepare(`INSERT OR IGNORE INTO tarot_readings (id, conversation_id, question, cards_payload, spread_type) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), readingId, readingQuestion, cardsPayload, 'tarot').run();
            }

            // Lưu text vào message_logs
            if (msg.text) {
                let dbText = msg.text;
                if (role === 'assistant' && msg.cards && Array.isArray(msg.cards) && msg.cards.length > 0) {
                    dbText = `<!-- CARDS_PAYLOAD: ${JSON.stringify(msg.cards)} -->\n` + dbText;
                }
                
                if (role === 'assistant') {
                    const actualModel = msg.model || 'n8n_agent';
                    const promptTokens = msg.usage?.prompt_tokens || 0;
                    const completionTokens = msg.usage?.completion_tokens || 0;
                    const totalTokens = msg.usage?.total_tokens || 0;
                    
                    await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model, prompt_tokens, completion_tokens, total_tokens) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(readingId, role, dbText, actualModel, promptTokens, completionTokens, totalTokens).run();
                } else {
                    await db.prepare(`INSERT INTO message_logs (conversation_id, role, content) VALUES (?, ?, ?)`).bind(readingId, role, dbText).run();
                }
            }
        }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Lỗi sync tarot:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
