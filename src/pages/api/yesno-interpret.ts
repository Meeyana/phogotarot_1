import type { APIRoute } from 'astro';
import { getSystemConfig } from '../../lib/config';
import { checkRateLimit } from '../../lib/rate-limiter';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  console.log('🔵 yesno-interpret API route called');
  let creditDeducted = false;
  let isDailyCreditDeducted = false;
  let refundQuestion = '';
  let premiumUsageTransactionIdForCleanup = '';
  let safeUserIdForRefund = null;
  let safeReadingIdForRefund = null;
  let dbForRefund = null;
  try {
    const clientIp = context.clientAddress || 'unknown';
    const identifier = context.locals.user ? context.locals.user.id : clientIp;
    const rateLimit = checkRateLimit(identifier, 5, 15);
    if (!rateLimit.success) {
      return new Response(JSON.stringify({ error: 'Bạn thao tác quá nhanh! Vui lòng đợi vài giây rồi thử lại.' }), { status: 429 });
    }

    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const config = await getSystemConfig(env);
    const webhookUrl = env.N8N_WEBHOOK_YESNO;
    const useN8nFirst = config.USE_LOCAL_AI === true;
    refundQuestion = String(body.question || '');
    
    if (!webhookUrl && useN8nFirst) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });

    const db = env.DB;
    dbForRefund = db;
    const user = context.locals.user;
    const safeReadingId = body.readingId || crypto.randomUUID();
    safeReadingIdForRefund = safeReadingId;
    let queryUserId = null;
    let profile: any = { name: 'lữ khách', gender: 'bạn', user_persona: '' };

    if (db) {
        if (user) {
            queryUserId = user.id;
        } else if (body.userId) {
            const isRealUser = await db.prepare('SELECT id FROM users WHERE id = ?').bind(body.userId).first();
            if (isRealUser) {
                return new Response(JSON.stringify({ error: 'Unauthorized: Vui lòng đăng nhập để sử dụng tài khoản này' }), { status: 401 });
            }
            queryUserId = body.userId;
        }

        
        if (db && safeReadingId) {
            const lockHash = btoa(unescape(encodeURIComponent((body.question || '') + JSON.stringify(body.cards || [])))).substring(0, 32);
            const lockProcessing = `<!-- PROCESSING_TAROT:${lockHash} -->`;
            const lockResultLike = `%CARDS_PAYLOAD:${lockHash}%`;

            const finishedLog = await db.prepare('SELECT content FROM message_logs WHERE conversation_id = ? AND role = "assistant" AND content LIKE ? ORDER BY id DESC LIMIT 1').bind(safeReadingId, lockResultLike).first();
            if (finishedLog) {
                console.log("DB Lock: Đã có kết quả luận giải cho readingId này, trả về ngay.");
                let interpretation = finishedLog.content.replace(/<!-- CARDS_PAYLOAD:.*?-->\n*/g, '');
                return new Response(JSON.stringify({ interpretation }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            const processingLog = await db.prepare('SELECT id FROM message_logs WHERE conversation_id = ? AND role = "assistant" AND content = ? AND created_at > datetime("now", "-1 minute") ORDER BY id DESC LIMIT 1').bind(safeReadingId, lockProcessing).first();
            if (processingLog) {
                console.log("DB Lock: Đang xử lý, bắt đầu Smart Polling...");
                for (let i = 0; i < 15; i++) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const checkFinished = await db.prepare('SELECT content FROM message_logs WHERE conversation_id = ? AND role = "assistant" AND content LIKE ? ORDER BY id DESC LIMIT 1').bind(safeReadingId, lockResultLike).first();
                    if (checkFinished) {
                        console.log("DB Lock: Đã có kết quả sau khi chờ.");
                        let interpretation = checkFinished.content.replace(/<!-- CARDS_PAYLOAD:.*?-->\n*/g, '');
                        return new Response(JSON.stringify({ interpretation }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                }
                console.log("DB Lock timeout for interpret, taking over...");
                await db.prepare('UPDATE message_logs SET created_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND role = "assistant" AND content = ?').bind(safeReadingId, lockProcessing).run();
            } else {
                await db.prepare('INSERT INTO message_logs (conversation_id, role, content) VALUES (?, "assistant", ?)').bind(safeReadingId, lockProcessing).run();
            }
        }
        

        if (queryUserId) {
            try {
                safeUserIdForRefund = queryUserId;
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

                // TRỪ CREDIT NGAY TRƯỚC KHI GỌI AI ĐỂ CHỐNG RACE CONDITION
                if (!isPremium) {
                    let updateResult = await db.prepare('UPDATE credit_wallets SET daily_credits = daily_credits - 1 WHERE user_id = ? AND daily_credits > 0').bind(queryUserId).run();
                    
                    if (updateResult.meta && updateResult.meta.changes === 0) {
                        updateResult = await db.prepare('UPDATE credit_wallets SET balance = balance - 1 WHERE user_id = ? AND balance > 0').bind(queryUserId).run();
                        if (updateResult.meta && updateResult.meta.changes > 0) {
                            creditDeducted = true;
                            isDailyCreditDeducted = false;
                        }
                    } else if (updateResult.meta && updateResult.meta.changes > 0) {
                        creditDeducted = true;
                        isDailyCreditDeducted = true;
                    }

                    if (!creditDeducted) {
                         return new Response(JSON.stringify({ 
                            error: 'Bạn đã hết lượt xem bài (Giao dịch đang xử lý). Vui lòng thử lại sau.', 
                            code: 'OUT_OF_CREDITS' 
                        }), { status: 402 });
                    }
                    
                    const creditSource = isDailyCreditDeducted ? 'free' : 'paid';
                    await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description, credit_source, feature, reference_id, question) VALUES (?, ?, -1, 'usage_yesno', 'Luận giải Yes/No', ?, 'yes_no', ?, ?)`).bind(crypto.randomUUID(), queryUserId, creditSource, safeReadingId, refundQuestion).run();
                } else {
                    premiumUsageTransactionIdForCleanup = crypto.randomUUID();
                    await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description, credit_source, feature, reference_id, question) VALUES (?, ?, 0, 'usage_yesno', 'Luận giải Yes/No (Premium)', 'paid', 'yes_no', ?, ?)`).bind(premiumUsageTransactionIdForCleanup, queryUserId, safeReadingId, refundQuestion).run();
                }

                // Lấy thông tin cá nhân hóa của user
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
                console.error("Lỗi lấy thông tin ví/profile user:", err);
            }
        }
    }

    body.userProfile = profile;

    let data: any;

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
                console.warn('n8n interpret trả về không phải JSON, chuyển sang AI nội bộ...');
                const { runYesNoInterpretWorker } = await import('../../lib/ai-workers');
                data = await runYesNoInterpretWorker(body, env, config);
            }
        } catch (e) {
            console.warn('n8n interpret failed, chuyển sang AI nội bộ...');
            const { runYesNoInterpretWorker } = await import('../../lib/ai-workers');
            data = await runYesNoInterpretWorker(body, env, config);
        }
    } else {
        console.log('[LOCAL AI] Sử dụng trực tiếp AI nội bộ cho Yes/No Interpret (Cloudflare Workers)...');
        const { runYesNoInterpretWorker } = await import('../../lib/ai-workers');
        data = await runYesNoInterpretWorker(body, env, config);
    }
    
    // NORMALIZE RAW LLM JSON (nếu n8n trả về mảng OpenAI schema)
    if (Array.isArray(data) && data[0]?.choices?.[0]?.message?.content) {
        data = {
            interpretation: data[0].choices[0].message.content,
            usage: data[0].usage || {},
            model: data[0].model || 'n8n_agent'
        };
    } else if (data && data.choices?.[0]?.message?.content) {
        data = {
            interpretation: data.choices[0].message.content,
            usage: data.usage || {},
            model: data.model || 'n8n_agent'
        };
    }

    // === LƯU VÀO D1 DATABASE & TRỪ CREDIT ===
    if (data && data.interpretation && env.DB) {
      try {
        const { question, cards, readingId } = body;
        
        if (!user) {
          throw new Error("Unauthorized: Cannot save reading without user");
        }
        
        const safeUserId = user.id;
        
        
        // 2. Lưu trực tiếp vào bảng yes_no_readings mới tạo
        const cardsPayload = JSON.stringify(cards || []);
        const actualModel = data.model || body.validationModel || 'n8n_agent';
        
        // Đếm tổng token nếu có trả về từ N8N (usage)
        let promptTokens = 0;
        let completionTokens = 0;
        let totalTokens = 0;
        
        if (data.usage) {
            promptTokens = data.usage.prompt_tokens || 0;
            completionTokens = data.usage.completion_tokens || 0;
            totalTokens = data.usage.total_tokens || 0;
        }

        await db.prepare(`
            INSERT INTO yes_no_readings (id, user_id, session_id, question, cards_payload, interpretation, model, prompt_tokens, completion_tokens, total_tokens) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            crypto.randomUUID(), 
            safeUserId, 
            safeReadingId,
            question || '', 
            cardsPayload,
            data.interpretation || '',
            actualModel,
            promptTokens,
            completionTokens,
            totalTokens
        ).run();

        // 3. Cập nhật Message Logs (giống tarot-interpret)
        let dbInterpretation = data.interpretation;
        if (cards && cards.length > 0) {
            const lockHash = btoa(unescape(encodeURIComponent((question || '') + JSON.stringify(cards || [])))).substring(0, 32);
            const lockProcessing = `<!-- PROCESSING_TAROT:${lockHash} -->`;
            dbInterpretation = `<!-- CARDS_PAYLOAD:${lockHash}:${JSON.stringify(cards)} -->\n` + dbInterpretation;
            
            const updateLog = await db.prepare("UPDATE message_logs SET content = ?, model = ?, prompt_tokens = ?, completion_tokens = ?, total_tokens = ? WHERE conversation_id = ? AND role = 'assistant' AND content = ?").bind(dbInterpretation, actualModel, promptTokens, completionTokens, totalTokens, safeReadingId, lockProcessing).run();
            if (updateLog.meta && updateLog.meta.changes === 0) {
                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model, prompt_tokens, completion_tokens, total_tokens) VALUES (?, 'assistant', ?, ?, ?, ?, ?)`).bind(safeReadingId, dbInterpretation, actualModel, promptTokens, completionTokens, totalTokens).run();
            }
        }
        
      } catch (dbError) {
        console.error("Lỗi lưu D1 (yesno):", dbError);
      }
    }

    // Ẩn tên model thực tế trước khi trả về Frontend
    if (data && data.model) {
        data.model = 'PhogoTarot Oracle';
    }

    // Xóa trường usage để tránh lộ token
    if (data) {
        delete data.usage;
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    // Hoàn tiền nếu đã trừ nhưng AI gặp lỗi
    if (!creditDeducted && premiumUsageTransactionIdForCleanup && dbForRefund) {
        try {
            await dbForRefund.prepare('DELETE FROM credit_transactions WHERE id = ?').bind(premiumUsageTransactionIdForCleanup).run();
        } catch (cleanupError) {
            console.error("Lỗi xóa log premium usage:", cleanupError);
        }
    }

    if (creditDeducted && safeUserIdForRefund && dbForRefund) {
        try {
            if (isDailyCreditDeducted) {
                await dbForRefund.prepare('UPDATE credit_wallets SET daily_credits = daily_credits + 1 WHERE user_id = ?').bind(safeUserIdForRefund).run();
            } else {
                await dbForRefund.prepare('UPDATE credit_wallets SET balance = balance + 1 WHERE user_id = ?').bind(safeUserIdForRefund).run();
            }
            const refundSource = isDailyCreditDeducted ? 'free' : 'paid';
            await dbForRefund.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description, credit_source, feature, reference_id, question) VALUES (?, ?, 1, 'refund', 'Hoàn tiền do lỗi hệ thống AI (Yes/No)', ?, 'yes_no', ?, ?)`).bind(crypto.randomUUID(), safeUserIdForRefund, refundSource, safeReadingIdForRefund, refundQuestion).run();
            await dbForRefund.prepare('DELETE FROM message_logs WHERE conversation_id = ? AND content = "<!-- PROCESSING_TAROT -->"').bind(safeReadingIdForRefund).run();
            console.log(`Đã hoàn tiền cho user ${safeUserIdForRefund} do lỗi AI`);
        } catch (refundError) {
            console.error("Lỗi hoàn tiền:", refundError);
        }
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
