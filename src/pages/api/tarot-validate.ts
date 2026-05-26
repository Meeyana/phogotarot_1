import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const webhookUrl = env.N8N_VALIDATE_TAROT;
    
    if (!webhookUrl) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });
    
    // Lấy thông tin cá nhân hóa của user
    const user = context.locals.user;
    let profile = { name: 'lữ khách', gender: 'bạn' };
    if (env.DB) {
        const queryUserId = user?.id || body.userId;
        if (queryUserId) {
            try {
                const row = await env.DB.prepare('SELECT full_name, nickname, gender FROM user_profiles WHERE user_id = ?').bind(queryUserId).first();
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
    
      // Kiểm tra Credit trước khi gọi AI
      if (user && env.DB) {
        try {
          const wallet = await env.DB.prepare('SELECT balance FROM credit_wallets WHERE user_id = ?').bind(user.id).first();
          if (!wallet) {
              // Tự động tạo ví cho user cũ (chưa có ví) với 10 lượt free
              await env.DB.prepare('INSERT INTO credit_wallets (user_id, balance) VALUES (?, 10)').bind(user.id).run();
              // Không throw 402 vì họ vừa được tạo ví 10 lượt
          } else if (wallet.balance <= 0) {
             return new Response(JSON.stringify({ 
                error: 'Bạn đã hết lượt xem bài. Vui lòng nạp thêm Credit để tiếp tục.', 
                code: 'OUT_OF_CREDITS' 
             }), { status: 402 });
          }
        } catch (dbErr) {
          console.error("Lỗi kiểm tra Credit:", dbErr);
        }
      }

      // Enrich thẻ bài với ý nghĩa từ DB
      if (body.cards && body.cards.length > 0 && env.DB) {
        for (let i = 0; i < body.cards.length; i++) {
            const card = body.cards[i];
            try {
                const cardInfo = await env.DB.prepare('SELECT upright_meaning, reversed_meaning FROM tarot_database WHERE card_name = ?').bind(card.name).first();
                if (cardInfo) {
                    card.meaning = card.isReversed ? cardInfo.reversed_meaning : cardInfo.upright_meaning;
                }
            } catch (err) {
                console.error(`Lỗi lấy ý nghĩa lá ${card.name}:`, err);
            }
        }
      }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // === LƯU VÀO D1 DATABASE ===
    if (data && env.DB) {
      try {
        const db = env.DB;
        const { question, readingId, isFollowUp } = body;
        
        // Lấy userId từ Middleware thay vì từ body để bảo mật
        const user = context.locals.user;
        if (user && question) {
            const safeUserId = user.id;
            const safeReadingId = readingId || crypto.randomUUID();
            const isValid = data.isValid === "true" || data.isValid === true;
            const pickCard = data.pick_card === "true" || data.pick_card === true;
            
            // CHỈ LƯU VÀO DB NẾU:
            // 1. Câu hỏi không hợp lệ (isValid = false) -> Bị từ chối
            // 2. Câu hỏi trò chuyện thông thường (isValid = true, pick_card = false) -> LLM trả lời trực tiếp
            // NẾU CÂU HỎI LÀ BỐC BÀI (isValid = true, pick_card = true) -> KHÔNG LƯU Ở ĐÂY!
            // Sẽ được lưu ở tarot-interpret.ts khi user ấn "Đồng ý" bốc bài.
            if (!isValid || !pickCard) {
                // 1. Đảm bảo Conversation tồn tại
                const title = question.length > 50 ? question.substring(0, 50) + '...' : question;
                await db.prepare(`INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)`).bind(safeReadingId, safeUserId, "Trò chuyện: " + title).run();
                
                // 2. Lưu tin nhắn User
                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content) VALUES (?, 'user', ?)`).bind(safeReadingId, question).run();
                
                // 3. Lưu tin nhắn Bot
                let botReply = data.reason || "Vui lòng đặt câu hỏi cụ thể hơn.";
                
                const actualModel = data.model || 'n8n_validate_agent';
                const promptTokens = data.usage?.prompt_tokens || 0;
                const completionTokens = data.usage?.completion_tokens || 0;
                const totalTokens = data.usage?.total_tokens || 0;

                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model, prompt_tokens, completion_tokens, total_tokens) VALUES (?, 'assistant', ?, ?, ?, ?, ?)`).bind(safeReadingId, botReply, actualModel, promptTokens, completionTokens, totalTokens).run();
                
                // 4. TRỪ CREDIT / TĂNG CHAT_COUNT (Chỉ tính nếu là chat hợp lệ, KHÔNG tính nếu câu hỏi bị từ chối)
                if (isValid && !pickCard) {
                    // Tăng biến đếm chat
                    await db.prepare('UPDATE credit_wallets SET chat_count = chat_count + 1 WHERE user_id = ?').bind(safeUserId).run();
                    
                    // Kiểm tra xem đã đạt 10 tin nhắn chưa
                    const walletAfter = await db.prepare('SELECT chat_count FROM credit_wallets WHERE user_id = ?').bind(safeUserId).first();
                    
                    if (walletAfter && walletAfter.chat_count >= 10) {
                        // Đủ 10 tin -> Trừ 1 credit và reset đếm
                        await db.prepare('UPDATE credit_wallets SET balance = balance - 1, chat_count = 0 WHERE user_id = ?').bind(safeUserId).run();
                        await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, -1, 'usage_tarot', 'Chat với Oracle (Gói 10 tin nhắn)')`).bind(crypto.randomUUID(), safeUserId).run();
                        
                        // Gắn cờ vào data trả về để frontend biết
                        data.creditDeducted = true;
                    }
                }
            }
        }
      } catch (dbError) {
        console.error("Lỗi lưu D1 (tarot-validate):", dbError);
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
