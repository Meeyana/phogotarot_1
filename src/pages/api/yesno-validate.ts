import type { APIRoute } from 'astro';
import { getRouteSystemConfig, getSystemConfig } from '../../lib/config';
import { checkRateLimit } from '../../lib/rate-limiter';
import { runAiProviderChain } from '../../lib/ai-provider-router';

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

    // Hashing question for unique DB Lock
    const questionSnippet = (body.question || '').substring(0, 100);
    const qHash = btoa(unescape(encodeURIComponent(questionSnippet))).substring(0, 32);
    const lockPrefix = `<!-- VALIDATE:${qHash}:`;
    const lockProcessing = `${lockPrefix}PROCESSING -->`;
    const lockResult = `${lockPrefix}RESULT:`;

    // DB LOCKING & SMART POLLING FOR VALIDATE
    if (context.locals.user && env.DB) {
        const recentLog = await env.DB.prepare('SELECT content FROM message_logs WHERE conversation_id = ? AND role = "system" AND content LIKE ? AND created_at > datetime("now", "-1 minute") ORDER BY id DESC LIMIT 1').bind(safeReadingId, `${lockPrefix}%`).first();
        if (recentLog) {
            if (recentLog.content === lockProcessing) {
                for (let i = 0; i < 15; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const checkFinished = await env.DB.prepare('SELECT content FROM message_logs WHERE conversation_id = ? AND role = "system" AND content LIKE ? AND created_at > datetime("now", "-1 minute") ORDER BY id DESC LIMIT 1').bind(safeReadingId, `${lockPrefix}%`).first();
                    if (checkFinished && checkFinished.content.startsWith(lockResult)) {
                        const jsonStr = checkFinished.content.replace(lockResult, '').replace(' -->', '');
                        return new Response(jsonStr, { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                }
                // Nếu đợi quá lâu (30s) mà vẫn PROCESSING, chứng tỏ request trước đã bị chết do user F5.
                // Chúng ta sẽ tiếp quản (take over) và cho phép code chạy tiếp xuống dưới để gọi n8n lại.
                console.log("DB Lock timeout, taking over...");
                await env.DB.prepare('UPDATE message_logs SET created_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND role = "system" AND content = ?').bind(safeReadingId, lockProcessing).run();
            } else if (recentLog.content.startsWith(lockResult)) {
                const jsonStr = recentLog.content.replace(lockResult, '').replace(' -->', '');
                return new Response(jsonStr, { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        }
        
        await env.DB.prepare('INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)').bind(safeReadingId, preQueryUserId, 'Khởi tạo').run(); // Đảm bảo conversation tồn tại trước khi insert message
        await env.DB.prepare('INSERT INTO message_logs (conversation_id, role, content) VALUES (?, "system", ?)').bind(safeReadingId, lockProcessing).run();
        lockedValidate = true;
    }
        
    const config = getRouteSystemConfig(await getSystemConfig(env), 'yesno');
    const webhookUrl = env.N8N_VALIDATE_YESNO;

    const db = env.DB;
    const user = context.locals.user;
    let queryUserId = null;

    if (db) {
        if (user) {
            queryUserId = user.id;
        } else if (body.userId) {
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
                        isValid: false,
                        reason: 'Bạn đã hết lượt xem bài. Vui lòng nạp thêm Credit để tiếp tục.',
                        error: 'OUT_OF_CREDITS' 
                    }), { status: 200 }); // Trả về 200 nhưng isValid = false để Frontend hiện lỗi đẹp
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin ví user:", err);
            }
        }
    }


    
    let profile = { name: 'lữ khách', gender: 'bạn', user_persona: '' };
    if (db && queryUserId) {
        try {
            const row = await db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(queryUserId).first();
            if (row) {
                profile.name = row.nickname || row.full_name || 'lữ khách';
                profile.gender = row.gender || 'bạn';
                
                let combinedPersona = [];
                let basicInfo = [];
                if (row.date_of_birth) basicInfo.push(`Sinh ngày: ${row.date_of_birth}`);
                if (row.location) basicInfo.push(`Nơi ở: ${row.location}`);
                
                if (basicInfo.length > 0) combinedPersona.push(`- Thông tin cơ bản: ${basicInfo.join(', ')}`);
                if (row.current_status) combinedPersona.push(`- Tình trạng hiện tại: ${row.current_status}`);
                if (row.user_persona) combinedPersona.push(`- Đánh giá năng lượng từ AI (Lịch sử): ${row.user_persona}`);
                
                profile.user_persona = combinedPersona.join('\n');
            }
        } catch (err) {
            console.error("Lỗi lấy user_profiles cho yesno:", err);
        }
    }
    body.userProfile = profile;


    const { runYesNoValidateWorker } = await import('../../lib/ai-workers');
    let data: any = await runAiProviderChain({
        config,
        webhookUrl,
        webhookLabel: 'yesno validate',
        payload: body,
        runWorker: () => runYesNoValidateWorker(body, env, config)
    });
    
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

    // Ẩn tên model thực tế trước khi trả về Frontend
    if (data && data.model) {
        data.model = 'PhogoTarot Oracle';
    }

    // Xóa trường usage để tránh lộ token
    if (data) {
        delete data.usage;
    }

    
    if (lockedValidate && env.DB) {
        await env.DB.prepare('UPDATE message_logs SET content = ? WHERE conversation_id = ? AND role = "system" AND content = ?').bind(`${lockResult}${JSON.stringify(data)} -->`, safeReadingId, lockProcessing).run();
    }
        
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    
    // --- LÊN LỊCH UNLOCK TỰ ĐỘNG ---
    const dbForUnlock = env.DB;
    const safeReadingIdForUnlock = safeReadingId;
    // Bỏ qua lỗi promise bị thả nổi (floating promise)
    (async () => {
        try {
            await new Promise(r => setTimeout(r, 60000));
            if (dbForUnlock) {
                await dbForUnlock.prepare('DELETE FROM message_logs WHERE conversation_id = ? AND role = "system" AND content = ?').bind(safeReadingIdForUnlock, lockProcessing).run();
            }
        } catch(e) {}
    })();
        
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
