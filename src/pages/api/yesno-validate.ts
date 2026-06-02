import type { APIRoute } from 'astro';
import { getSystemConfig } from '../../lib/config';
import { checkRateLimit } from '../../lib/rate-limiter';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    // Rate Limiting
    const clientIp = context.clientAddress || 'unknown';
    const identifier = context.locals.user ? context.locals.user.id : clientIp;
    const rateLimit = checkRateLimit(identifier, 1, 3);
    if (!rateLimit.success) {
      return new Response(JSON.stringify({ error: 'Bạn thao tác quá nhanh! Vui lòng đợi vài giây rồi thử lại.' }), { status: 429 });
    }

    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const config = await getSystemConfig(env);
    const webhookUrl = env.N8N_VALIDATE_YESNO;
    const useN8nFirst = config.USE_LOCAL_AI === true;
    if (!webhookUrl && useN8nFirst) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });

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
                console.warn('n8n validate trả về không phải JSON, chuyển sang AI nội bộ...');
                const { runYesNoValidateWorker } = await import('../../lib/ai-workers');
                data = await runYesNoValidateWorker(body, env, config);
            }
        } catch (e) {
            console.warn('n8n validate failed, chuyển sang AI nội bộ...');
            const { runYesNoValidateWorker } = await import('../../lib/ai-workers');
            data = await runYesNoValidateWorker(body, env, config);
        }
    } else {
        console.log('[LOCAL AI] Sử dụng trực tiếp AI nội bộ cho Yes/No Validate (Cloudflare Workers)...');
        const { runYesNoValidateWorker } = await import('../../lib/ai-workers');
        data = await runYesNoValidateWorker(body, env, config);
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
