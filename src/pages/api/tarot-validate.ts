import type { APIRoute } from 'astro';
import { getSystemConfig } from '../../lib/config';
import { checkRateLimit } from '../../lib/rate-limiter';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  let lockedValidate = false;
  let safeReadingIdForUnlock = '';
  let dbForUnlock: any = null;

  try {
    // Rate Limiting
    const clientIp = context.clientAddress || 'unknown';
    const identifier = context.locals.user ? context.locals.user.id : clientIp;
    const rateLimit = checkRateLimit(identifier, 5, 10);
    if (!rateLimit.success) {
      return new Response(JSON.stringify({ error: 'Bạn thao tác quá nhanh! Vui lòng đợi vài giây rồi thử lại.' }), { status: 429 });
    }


    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const safeReadingId = body.readingId || crypto.randomUUID();
    
    lockedValidate = false;
    safeReadingIdForUnlock = safeReadingId;
    dbForUnlock = env.DB;
    
    let preQueryUserId = context.locals.user ? context.locals.user.id : (body.userId || 'guest');

    // DB LOCKING & SMART POLLING FOR VALIDATE
    if (context.locals.user && env.DB) {
        const recentLog = await env.DB.prepare('SELECT content FROM message_logs WHERE conversation_id = ? AND role = "system" AND content LIKE ? AND created_at > datetime("now", "-1 minute") ORDER BY id DESC LIMIT 1').bind(safeReadingId, '<!-- VALIDATE:%').first();
        if (recentLog) {
            if (recentLog.content === '<!-- VALIDATE:PROCESSING -->') {
                for (let i = 0; i < 15; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const checkFinished = await env.DB.prepare('SELECT content FROM message_logs WHERE conversation_id = ? AND role = "system" AND content LIKE ? AND created_at > datetime("now", "-1 minute") ORDER BY id DESC LIMIT 1').bind(safeReadingId, '<!-- VALIDATE:%').first();
                    if (checkFinished && checkFinished.content.startsWith('<!-- VALIDATE:RESULT:')) {
                        const jsonStr = checkFinished.content.replace('<!-- VALIDATE:RESULT:', '').replace(' -->', '');
                        return new Response(jsonStr, { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                }
                return new Response(JSON.stringify({ error: 'AI đang xử lý nhưng mất quá nhiều thời gian. Vui lòng thử lại sau.' }), { status: 504 });
            } else if (recentLog.content.startsWith('<!-- VALIDATE:RESULT:')) {
                const jsonStr = recentLog.content.replace('<!-- VALIDATE:RESULT:', '').replace(' -->', '');
                return new Response(jsonStr, { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        }
        
        await env.DB.prepare('INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)').bind(safeReadingId, preQueryUserId, 'Khởi tạo').run(); // Đảm bảo conversation tồn tại trước khi insert message
        await env.DB.prepare('INSERT INTO message_logs (conversation_id, role, content) VALUES (?, "system", "<!-- VALIDATE:PROCESSING -->")').bind(safeReadingId).run();
        lockedValidate = true;
    }
        
    const config = await getSystemConfig(env);
    const webhookUrl = env.N8N_VALIDATE_TAROT
      || 'https://n8n.n8ntuanphangz.xyz/webhook/7179b8ca-c774-47a9-9ed4-6bf975344058'; // fallback localhost
    
    if (!webhookUrl && config.USE_LOCAL_AI) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });
    
    // Lấy thông tin cá nhân hóa của user
    const user = context.locals.user;
    let profile: any = { name: 'lữ khách', gender: 'bạn', user_persona: '' };
    if (env.DB) {
        let queryUserId = null;
        if (user) {
            queryUserId = user.id; // Lấy ID an toàn từ session
        } else if (body.userId) {
            // Chặn hacker giả mạo ID người khác
            const isRealUser = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(body.userId).first();
            if (isRealUser) {
                return new Response(JSON.stringify({ error: 'Unauthorized: Vui lòng đăng nhập để sử dụng tài khoản này' }), { status: 401 });
            }
            queryUserId = body.userId; // Guest hợp lệ
        }

        if (queryUserId) {
            try {
                const row = await env.DB.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(queryUserId).first();
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
                console.error("Lỗi lấy user_profiles:", err);
            }
        }
    }
    body.userProfile = profile;
    
      // Kiểm tra Credit trước khi gọi AI
      if (user && env.DB) {
        try {
          const vnTime = new Date(new Date().getTime() + 7 * 3600 * 1000);
          const todayStr = vnTime.toISOString().split('T')[0];
          
          let wallet = await env.DB.prepare('SELECT balance, daily_credits, last_daily_reset, subscription_tier, subscription_expires_at FROM credit_wallets WHERE user_id = ?').bind(user.id).first();
          
          if (!wallet) {
              // Tự động tạo ví cho user cũ (chưa có ví)
              await env.DB.prepare('INSERT INTO credit_wallets (user_id, balance, daily_credits, last_daily_reset) VALUES (?, 1, 1, ?)').bind(user.id, todayStr).run();
              wallet = { balance: 1, daily_credits: 1, subscription_tier: 'free' };
          } else {
              // Reset daily credit
              if (wallet.last_daily_reset !== todayStr) {
                  await env.DB.prepare('UPDATE credit_wallets SET daily_credits = 1, last_daily_reset = ? WHERE user_id = ?').bind(todayStr, user.id).run();
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
        } catch (dbErr) {
          console.error("Lỗi kiểm tra Credit:", dbErr);
        }
      }

      // Enrich thẻ bài với ý nghĩa từ DB
      if (body.cards && body.cards.length > 0 && env.DB) {
        for (let i = 0; i < body.cards.length; i++) {
            const card = body.cards[i];
            try {
                const isRev = card.isReversed !== undefined ? card.isReversed : (card.orientation === 'Ngược' || card.orientation === 'ngược');
              const cardInfo = await env.DB.prepare(`SELECT 
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
      if (body.reader_id && env.DB) {
          try {
              const reader = await env.DB.prepare('SELECT system_prompt, self_pronoun, user_pronoun FROM tarot_readers WHERE id = ?').bind(body.reader_id).first();
              if (reader) {
                  body.reader_prompt = reader.system_prompt;
                    body.reader_self_pronoun = reader.self_pronoun || 'mình';
                    body.reader_user_pronoun = reader.user_pronoun || 'bạn';
              }
          } catch (err) {
              console.error(`Lỗi lấy system_prompt cho reader ${body.reader_id}:`, err);
          }
      }

    let data: any;
    const useN8nFirst = config.USE_LOCAL_AI === true;

    if (useN8nFirst && webhookUrl) {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`n8n HTTP error ${response.status}`);
            }

            const responseText = await response.text();
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.warn('n8n validate trả về không phải JSON, chuyển sang AI nội bộ...');
                const { runTarotValidateWorker } = await import('../../lib/ai-workers');
                data = await runTarotValidateWorker(body, env, config);
            }
        } catch (e) {
            console.warn('n8n validate failed, chuyển sang AI nội bộ...');
            const { runTarotValidateWorker } = await import('../../lib/ai-workers');
            data = await runTarotValidateWorker(body, env, config);
        }
    } else {
        console.log('[LOCAL AI] Sử dụng trực tiếp AI nội bộ (Cloudflare Workers)...');
        const { runTarotValidateWorker } = await import('../../lib/ai-workers');
        data = await runTarotValidateWorker(body, env, config);
    }
    
    // NORMALIZE RAW LLM JSON (nếu n8n trả về mảng OpenAI schema)
    let rawContent = null;
    let rawUsage = null;
    let rawModel = null;
    if (Array.isArray(data) && data[0]?.choices?.[0]?.message?.content) {
        rawContent = data[0].choices[0].message.content;
        rawUsage = data[0].usage || {};
        rawModel = data[0].model || 'n8n_agent';
    } else if (data && data.choices?.[0]?.message?.content) {
        rawContent = data.choices[0].message.content;
        rawUsage = data.usage || {};
        rawModel = data.model || 'n8n_agent';
    }

    if (rawContent) {
        try {
            let cleanContent = rawContent;
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json/, '').replace(/```$/, '').trim();
            }
            const parsed = JSON.parse(cleanContent);
            data = {
                ...parsed,
                usage: rawUsage,
                model: rawModel
            };
        } catch(e) {
            data = {
                isValid: true,
                reason: rawContent,
                pick_card: true,
                usage: rawUsage,
                model: rawModel
            };
        }
    }

    // === LƯU VÀO D1 DATABASE ===
    if (data && env.DB) {
      try {
        const db = env.DB;
        const { question, readingId, isFollowUp } = body;
        
        // Lấy userId từ Middleware thay vì từ body để bảo mật
        const user = context.locals.user;
        if (user && question) {
            const safeUserId = user.id;
             // replaced
            const isValid = data.isValid === "true" || data.isValid === true;
            const pickCard = data.pick_card === "true" || data.pick_card === true;
            const actualModel = data.model || 'n8n_validate_agent';
            const promptTokens = data.usage?.prompt_tokens || 0;
            const completionTokens = data.usage?.completion_tokens || 0;
            const totalTokens = data.usage?.total_tokens || 0;

            if (!isValid || !pickCard) {
                // 1. Đảm bảo Conversation tồn tại
                const title = question.length > 50 ? question.substring(0, 50) + '...' : question;
                await db.prepare(`INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)`).bind(safeReadingId, safeUserId, "Trò chuyện: " + title).run();
                
                // 2. Lưu tin nhắn User kèm Token validate trực tiếp
                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model, prompt_tokens, completion_tokens, total_tokens) VALUES (?, 'user', ?, ?, ?, ?, ?)`).bind(safeReadingId, question, actualModel, promptTokens, completionTokens, totalTokens).run();
                
                // 3. Lưu tin nhắn Bot (Phần này không kèm token nữa để tránh double-count)
                let botReply = data.reason || "Vui lòng đặt câu hỏi cụ thể hơn.";
                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content) VALUES (?, 'assistant', ?)`).bind(safeReadingId, botReply).run();
                
                // 4. TRỪ CREDIT / TĂNG CHAT_COUNT (Chỉ tính nếu là chat hợp lệ, KHÔNG tính nếu câu hỏi bị từ chối)
                if (isValid && !pickCard) {
                    // Tăng biến đếm chat
                    await db.prepare('UPDATE credit_wallets SET chat_count = chat_count + 1 WHERE user_id = ?').bind(safeUserId).run();
                    
                    // Kiểm tra xem đã đạt 10 tin nhắn chưa
                    const walletAfter = await db.prepare('SELECT chat_count, balance, daily_credits, subscription_tier, subscription_expires_at FROM credit_wallets WHERE user_id = ?').bind(safeUserId).first();
                    
                    if (walletAfter && walletAfter.chat_count >= 10) {
                        const isPremium = walletAfter.subscription_tier === 'premium' && (!walletAfter.subscription_expires_at || new Date(walletAfter.subscription_expires_at) > new Date());
                        
                        if (!isPremium) {
                            // Thử trừ lượt miễn phí hàng ngày trước, kèm điều kiện chat_count >= 10 (chống Race Condition)
                            let updateResult = await db.prepare('UPDATE credit_wallets SET daily_credits = daily_credits - 1, chat_count = 0 WHERE user_id = ? AND daily_credits > 0 AND chat_count >= 10').bind(safeUserId).run();
                            
                            // Nếu hết daily_credits, thử trừ vào balance
                            if (updateResult.meta && updateResult.meta.changes === 0) {
                                updateResult = await db.prepare('UPDATE credit_wallets SET balance = balance - 1, chat_count = 0 WHERE user_id = ? AND balance > 0 AND chat_count >= 10').bind(safeUserId).run();
                            }
                            
                            if (updateResult.meta && updateResult.meta.changes > 0) {
                                await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, -1, 'usage_tarot', 'Chat với Oracle (Gói 10 tin nhắn)')`).bind(crypto.randomUUID(), safeUserId).run();
                                data.creditDeducted = true;
                            } else {
                                // Nếu changes = 0 thì luồng khác đã update mất rồi
                                data.creditDeducted = false;
                            }
                        } else {
                            // Nếu là Premium, chỉ reset biến đếm (Atomic)
                            await db.prepare('UPDATE credit_wallets SET chat_count = 0 WHERE user_id = ? AND chat_count >= 10').bind(safeUserId).run();
                            data.creditDeducted = false;
                        }
                    }
                }
            } else {
                // LƯU CÂU HỎI VÀ LƯU TOKEN VALIDATE TRỰC TIẾP LÊN DÒNG TIN NHẮN CỦA USER (Nhánh pick_card = true)
                const title = question.length > 50 ? question.substring(0, 50) + '...' : question;
                await db.prepare(`INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)`).bind(safeReadingId, safeUserId, "Trải bài: " + title).run();
                
                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model, prompt_tokens, completion_tokens, total_tokens) VALUES (?, 'user', ?, ?, ?, ?, ?)`).bind(safeReadingId, question, actualModel, promptTokens, completionTokens, totalTokens).run();
            }
        }
      } catch (dbError) {
        console.error("Lỗi lưu D1 (tarot-validate):", dbError);
      }
    }

    // Ẩn tên model thực tế trước khi trả về Frontend
    if (data && data.model) {
        data.model = 'PhogoTarot Oracle';
    }

    // Xóa các trường nội bộ không cần thiết lộ ra ngoài Network
    if (data) {
        delete data.usage;
        delete data.topic;
        delete data.needs_image;
    }

    
    if (lockedValidate && env.DB) {
        await env.DB.prepare('UPDATE message_logs SET content = ? WHERE conversation_id = ? AND role = "system" AND content = "<!-- VALIDATE:PROCESSING -->"').bind(`<!-- VALIDATE:RESULT:${JSON.stringify(data)} -->`, safeReadingId).run();
    }
        
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    
    if (lockedValidate && dbForUnlock && safeReadingIdForUnlock) {
        try {
            await dbForUnlock.prepare('DELETE FROM message_logs WHERE conversation_id = ? AND role = "system" AND content = "<!-- VALIDATE:PROCESSING -->"').bind(safeReadingIdForUnlock).run();
        } catch(e) {}
    }
        
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
