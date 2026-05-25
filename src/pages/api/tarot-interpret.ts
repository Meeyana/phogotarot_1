import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  console.log('🔵 tarot-interpret API route called');
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const webhookUrl = env.N8N_WEBHOOK_TAROT;
    
    if (!webhookUrl) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });

    const db = env.DB;
    
    // Lấy thông tin cá nhân hóa của user
    const user = context.locals.user;
    let profile = { name: 'lữ khách', gender: 'bạn' };
    if (db) {
        const queryUserId = user?.id || body.userId;
        if (queryUserId) {
            try {
                const row = await db.prepare('SELECT full_name, nickname, gender FROM user_profiles WHERE user_id = ?').bind(queryUserId).first();
                if (row) {
                    profile.name = row.nickname || row.full_name || 'lữ khách';
                    profile.gender = row.gender || 'bạn';
                }
            } catch (err) {
                console.error("Lỗi lấy user_profiles:", err);
            }
        }
    }
    body.userProfile = profile;
    
    let history = [];
    if (db && body.readingId) {
      try {
        const logs = await db.prepare('SELECT role, content FROM message_logs WHERE conversation_id = ? ORDER BY id ASC').bind(body.readingId).all();
        if (logs && logs.results) {
          history = logs.results;
        }
      } catch (err) {
        console.error("Lỗi lấy lịch sử:", err);
      }
    }

    // Enrich thẻ bài với ý nghĩa từ DB
    if (body.cards && body.cards.length > 0 && db) {
      for (let i = 0; i < body.cards.length; i++) {
          const card = body.cards[i];
          try {
              const cardInfo = await db.prepare('SELECT upright_meaning, reversed_meaning FROM tarot_database WHERE card_name = ?').bind(card.name).first();
              if (cardInfo) {
                  card.meaning = card.isReversed ? cardInfo.reversed_meaning : cardInfo.upright_meaning;
              }
          } catch (err) {
              console.error(`Lỗi lấy ý nghĩa lá ${card.name}:`, err);
          }
      }
    }

    const payload = {
      ...body,
      history: history
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // === LƯU VÀO D1 DATABASE ===
    if (data && data.interpretation && env.DB) {
      try {
        const db = env.DB;
        const { question, cards, readingId } = body;
        
        // Lấy userId từ Middleware thay vì từ body để bảo mật
        const user = context.locals.user;
        if (!user) {
          throw new Error("Unauthorized: Cannot save reading without user");
        }
        
        const safeUserId = user.id;
        const safeReadingId = readingId || crypto.randomUUID();
        
        // 2. Lưu Conversation (Bỏ qua bước lưu User vì user bắt buộc đã tồn tại khi đăng nhập)
        const title = question ? (question.length > 50 ? question.substring(0, 50) + '...' : question) : 'Trải bài Tarot';
        await db.prepare(`INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)`).bind(safeReadingId, safeUserId, title).run();
        
        // 3. Lưu Tarot Reading
        const cardsPayload = JSON.stringify(cards || []);
        await db.prepare(`INSERT OR IGNORE INTO tarot_readings (id, conversation_id, question, cards_payload, spread_type) VALUES (?, ?, ?, ?, ?)`).bind(crypto.randomUUID(), safeReadingId, question || '', cardsPayload, 'tarot').run();
        
        // 4. Lưu Message Logs (User & Assistant)
        if (question) {
           const questionAlreadySaved = history.some((msg: any) => msg.role === 'user' && msg.content === question);
           if (!questionAlreadySaved) {
               await db.prepare(`INSERT INTO message_logs (conversation_id, role, content) VALUES (?, 'user', ?)`).bind(safeReadingId, question).run();
           }
        }
        const actualModel = data.model || body.validationModel || 'n8n_agent';
        const valUsage = body.validationUsage || {};
        const dataUsage = data.usage || {};
        
        const promptTokens = (valUsage.prompt_tokens || 0) + (dataUsage.prompt_tokens || 0);
        const completionTokens = (valUsage.completion_tokens || 0) + (dataUsage.completion_tokens || 0);
        const totalTokens = (valUsage.total_tokens || 0) + (dataUsage.total_tokens || 0);

        // Trả về usage tổng hợp cho frontend để lưu vào localStorage
        data.usage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens
        };
        data.model = actualModel;

        await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model, prompt_tokens, completion_tokens, total_tokens) VALUES (?, 'assistant', ?, ?, ?, ?, ?)`).bind(safeReadingId, data.interpretation, actualModel, promptTokens, completionTokens, totalTokens).run();
        
      } catch (dbError) {
        console.error("Lỗi lưu D1 (tarot):", dbError);
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
