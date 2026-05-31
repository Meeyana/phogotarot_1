import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  console.log('🔵 tarot-interpret API route called');
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const webhookUrl = env.N8N_WEBHOOK_TAROT
      || 'https://n8n.n8ntuanphangz.xyz/webhook/fc76868a-6ee3-4376-98fe-b5db66b7a3ee'; // fallback localhost
    
    if (!webhookUrl) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });

    const db = env.DB;
    
    // Lấy thông tin cá nhân hóa của user
    const user = context.locals.user;
    let profile: any = { name: 'lữ khách', gender: 'bạn', user_persona: '' };
    if (db) {
        let queryUserId = null;
        if (user) {
            queryUserId = user.id; // Lấy ID an toàn từ session
        } else if (body.userId) {
            // Chặn hacker giả mạo ID người khác
            const isRealUser = await db.prepare('SELECT id FROM users WHERE id = ?').bind(body.userId).first();
            if (isRealUser) {
                return new Response(JSON.stringify({ error: 'Unauthorized: Vui lòng đăng nhập để sử dụng tài khoản này' }), { status: 401 });
            }
            queryUserId = body.userId; // Guest hợp lệ
        }

        if (queryUserId) {
            try {
                // Kiểm tra Credit trước
                const vnTime = new Date(new Date().getTime() + 7 * 3600 * 1000);
                const todayStr = vnTime.toISOString().split('T')[0];
                let wallet = await db.prepare('SELECT balance, daily_credits, last_daily_reset, subscription_tier, subscription_expires_at FROM credit_wallets WHERE user_id = ?').bind(queryUserId).first();
                
                if (!wallet) {
                    await db.prepare('INSERT INTO credit_wallets (user_id, balance, daily_credits, last_daily_reset) VALUES (?, 1, 1, ?)').bind(queryUserId, todayStr).run();
                    wallet = { balance: 1, daily_credits: 1, subscription_tier: 'free' };
                } else {
                    if (wallet.last_daily_reset !== todayStr) {
                        await db.prepare('UPDATE credit_wallets SET daily_credits = 1, last_daily_reset = ? WHERE user_id = ?').bind(todayStr, queryUserId).run();
                        wallet.daily_credits = 1;
                    }
                }

                const isPremium = wallet.subscription_tier === 'premium' && (!wallet.subscription_expires_at || new Date(wallet.subscription_expires_at) > new Date());
                
                if (!isPremium && wallet.balance <= 0 && wallet.daily_credits <= 0) {
                    return new Response(JSON.stringify({ 
                        error: 'Bạn đã hết lượt xem bài. Vui lòng <a href="/nap-credit" style="color: var(--gold-color); text-decoration: underline;">nạp thêm Credit</a> để tiếp tục.', 
                        code: 'OUT_OF_CREDITS' 
                    }), { status: 402 });
                }

                const row = await db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(queryUserId).first();
                if (row) {
                    profile.name = row.nickname || row.full_name || 'lữ khách';
                    profile.gender = row.gender || 'bạn';
                    
                    let combinedPersona = [];
                    let basicInfo = [];
                    if (row.date_of_birth) basicInfo.push(`Sinh ngày: ${row.date_of_birth}`);
                    if (row.location) basicInfo.push(`Nơi ở: ${row.location}`);
                    if (row.occupation) basicInfo.push(`Nghề nghiệp: ${row.occupation}`);
                    if (row.relationship_status) basicInfo.push(`Tình trạng quan hệ: ${row.relationship_status}`);
                    
                    if (basicInfo.length > 0) {
                        combinedPersona.push(`- Thông tin cơ bản: ${basicInfo.join(', ')}`);
                    }
                    
                    if (row.recent_events && row.recent_events.trim() !== '') {
                        combinedPersona.push(`- Biến cố gần đây / Cần tư vấn: ${row.recent_events}`);
                    }
                    if (row.user_persona && row.user_persona.trim() !== '') {
                        combinedPersona.push(`- Đánh giá năng lượng từ AI (Lịch sử): ${row.user_persona}`);
                    }
                    
                    profile.user_persona = combinedPersona.join('\n');
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin user:", err);
            }
        }
    }
    body.userProfile = profile;
    
    let history = [];
    if (db && body.readingId) {
      try {
        const logs = await db.prepare("SELECT role, content FROM (SELECT * FROM message_logs WHERE conversation_id = ? AND role != 'system' ORDER BY id DESC LIMIT 12) ORDER BY id ASC").bind(body.readingId).all();
        if (logs && logs.results) {
          history = logs.results.map((msg: any) => {
              if (msg.content) {
                  msg.content = msg.content.replace(/<!-- CARDS_PAYLOAD: .*? -->\n*/g, '');
              }
              return msg;
          });
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
              const isRev = card.isReversed !== undefined ? card.isReversed : (card.orientation === 'Ngược' || card.orientation === 'ngược');
              const cardInfo = await db.prepare(`SELECT 
                    upright_meaning, reversed_meaning, image_description,
                    upright_keyword, reversed_keyword,
                    upright_love_keyword, reversed_love_keyword,
                    upright_career_keyword, reversed_career_keyword,
                    upright_finances_keyword, reversed_finances_keyword,
                      upright_love_meaning, reversed_love_meaning,
                      upright_career_meaning, reversed_career_meaning,
                      upright_finances_meaning, reversed_finances_meaning
                    FROM tarot_database WHERE card_name = ?`).bind(card.name).first();
              if (cardInfo) {
                  card.isReversed = isRev;
                  card.meaning = isRev ? cardInfo.reversed_meaning : cardInfo.upright_meaning;
                    card.meanings = {
                        general: isRev ? cardInfo.reversed_meaning : cardInfo.upright_meaning,
                        love: isRev ? cardInfo.reversed_love_meaning : cardInfo.upright_love_meaning,
                        career: isRev ? cardInfo.reversed_career_meaning : cardInfo.upright_career_meaning,
                        finances: isRev ? cardInfo.reversed_finances_meaning : cardInfo.upright_finances_meaning
                    };
                  if (cardInfo.image_description) {
                      card.description = cardInfo.image_description;
                  }
                  card.keyword = {
                      general: isRev ? cardInfo.reversed_keyword : cardInfo.upright_keyword,
                      love: isRev ? cardInfo.reversed_love_keyword : cardInfo.upright_love_keyword,
                      career: isRev ? cardInfo.reversed_career_keyword : cardInfo.upright_career_keyword,
                      finances: isRev ? cardInfo.reversed_finances_keyword : cardInfo.upright_finances_keyword
                  };
              }
          } catch (err) {
              console.error(`Lỗi lấy ý nghĩa lá ${card.name}:`, err);
          }
      }
    }

    // Lấy System Prompt của Reader nếu có
    if (body.reader_id && db) {
        try {
            const reader = await db.prepare('SELECT system_prompt, self_pronoun, user_pronoun FROM tarot_readers WHERE id = ?').bind(body.reader_id).first();
            if (reader) {
                body.reader_prompt = reader.system_prompt;
                    body.reader_self_pronoun = reader.self_pronoun || 'mình';
                    body.reader_user_pronoun = reader.user_pronoun || 'bạn';
            }
        } catch (err) {
            console.error(`Lỗi lấy system_prompt cho reader ${body.reader_id}:`, err);
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

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('n8n webhook trả về không phải JSON:', response.status, responseText.substring(0, 300));
      return new Response(JSON.stringify({ error: `Lỗi luận giải: n8n webhook không phản hồi JSON hợp lệ (HTTP ${response.status})` }), { 
        status: 502, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
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
        
        // 4. Lưu Message Logs (Chỉ Assistant, vì User đã được lưu ở tarot-validate)
        const actualModel = data.model || 'n8n_agent';
        const dataUsage = data.usage || {};
        
        const promptTokens = dataUsage.prompt_tokens || 0;
        const completionTokens = dataUsage.completion_tokens || 0;
        const totalTokens = dataUsage.total_tokens || 0;

        // Trả về usage tổng hợp cho frontend để lưu vào localStorage
        data.usage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens
        };
        data.model = actualModel;

        let dbInterpretation = data.interpretation;
        if (cards && cards.length > 0) {
            dbInterpretation = `<!-- CARDS_PAYLOAD: ${JSON.stringify(cards)} -->\n` + dbInterpretation;
        }

        await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model, prompt_tokens, completion_tokens, total_tokens) VALUES (?, 'assistant', ?, ?, ?, ?, ?)`).bind(safeReadingId, dbInterpretation, actualModel, promptTokens, completionTokens, totalTokens).run();
        
        // 5. TRỪ CREDIT (Chống Race Condition bằng Atomic Update)
        const walletAfter = await db.prepare('SELECT subscription_tier, subscription_expires_at FROM credit_wallets WHERE user_id = ?').bind(safeUserId).first();
        if (walletAfter) {
            const isPremium = walletAfter.subscription_tier === 'premium' && (!walletAfter.subscription_expires_at || new Date(walletAfter.subscription_expires_at) > new Date());
            if (!isPremium) {
                // Thử trừ lượt miễn phí hàng ngày trước
                let updateResult = await db.prepare('UPDATE credit_wallets SET daily_credits = daily_credits - 1 WHERE user_id = ? AND daily_credits > 0').bind(safeUserId).run();
                
                // Nếu hết lượt ngày (changes = 0), mới trừ vào balance chính
                if (updateResult.meta && updateResult.meta.changes === 0) {
                    updateResult = await db.prepare('UPDATE credit_wallets SET balance = balance - 1 WHERE user_id = ? AND balance > 0').bind(safeUserId).run();
                }

                // Nếu update thành công (có trừ được tiền), ghi log giao dịch
                if (updateResult.meta && updateResult.meta.changes > 0) {
                    await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, -1, 'usage_tarot', 'Luận giải Tarot 3 lá')`).bind(crypto.randomUUID(), safeUserId).run();
                }
            }
        }
        
      } catch (dbError) {
        console.error("Lỗi lưu D1 (tarot):", dbError);
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
