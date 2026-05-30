import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const webhookUrl = env.N8N_VALIDATE_YESNO;
    
    if (!webhookUrl) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });

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

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
