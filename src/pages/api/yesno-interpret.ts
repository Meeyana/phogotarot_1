import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  console.log('🔵 yesno-interpret API route called');
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const webhookUrl = env.N8N_WEBHOOK_YESNO;
    
    if (!webhookUrl) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });

    const db = env.DB;
    const user = context.locals.user;
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
                        error: 'Bạn đã hết lượt xem bài. Vui lòng <a href="/nap-credit" style="color: var(--gold-primary); text-decoration: underline;">nạp thêm Credit</a> để tiếp tục.', 
                        code: 'OUT_OF_CREDITS' 
                    }), { status: 402 });
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

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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

    // === LƯU VÀO D1 DATABASE & TRỪ CREDIT ===
    if (data && data.interpretation && env.DB) {
      try {
        const { question, cards, readingId } = body;
        
        if (!user) {
          throw new Error("Unauthorized: Cannot save reading without user");
        }
        
        const safeUserId = user.id;
        const safeReadingId = readingId || crypto.randomUUID();
        
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
        
        // 5. TRỪ CREDIT
        const walletAfter = await db.prepare('SELECT subscription_tier, subscription_expires_at FROM credit_wallets WHERE user_id = ?').bind(safeUserId).first();
        if (walletAfter) {
            const isPremium = walletAfter.subscription_tier === 'premium' && (!walletAfter.subscription_expires_at || new Date(walletAfter.subscription_expires_at) > new Date());
            if (!isPremium) {
                let updateResult = await db.prepare('UPDATE credit_wallets SET daily_credits = daily_credits - 1 WHERE user_id = ? AND daily_credits > 0').bind(safeUserId).run();
                if (updateResult.meta && updateResult.meta.changes === 0) {
                    updateResult = await db.prepare('UPDATE credit_wallets SET balance = balance - 1 WHERE user_id = ? AND balance > 0').bind(safeUserId).run();
                }
                if (updateResult.meta && updateResult.meta.changes > 0) {
                    await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, -1, 'usage_yesno', 'Luận giải Yes/No')`).bind(crypto.randomUUID(), safeUserId).run();
                }
            }
        }
      } catch (dbError) {
        console.error("Lỗi lưu D1 (yesno):", dbError);
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
