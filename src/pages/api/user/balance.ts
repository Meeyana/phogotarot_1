import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const user = context.locals.user;
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    let wallet = await db.prepare('SELECT balance, daily_credits, last_daily_reset, subscription_tier, subscription_expires_at FROM credit_wallets WHERE user_id = ?').bind(user.id).first();
    
    if (!wallet) {
        // Tự động tạo ví cho người cũ chưa có ví
        try {
            const vnTime = new Date(new Date().getTime() + 7 * 3600 * 1000);
            const todayStr = vnTime.toISOString().split('T')[0];
            await db.prepare('INSERT INTO credit_wallets (user_id, balance, daily_credits, last_daily_reset) VALUES (?, 1, 1, ?)').bind(user.id, todayStr).run();
            wallet = { balance: 1, daily_credits: 1, subscription_tier: 'free' };
        } catch (err) {
            console.error("Lỗi tạo ví tự động:", err);
            wallet = { balance: 0, daily_credits: 0, subscription_tier: 'free' };
        }
    } else {
        // Kiểm tra daily reset
        const vnTime = new Date(new Date().getTime() + 7 * 3600 * 1000);
        const todayStr = vnTime.toISOString().split('T')[0];
        
        if (wallet.last_daily_reset !== todayStr) {
            // Qua ngày mới -> Cấp 1 daily_credit
            await db.prepare('UPDATE credit_wallets SET daily_credits = 1, last_daily_reset = ? WHERE user_id = ?').bind(todayStr, user.id).run();
            wallet.daily_credits = 1;
        }
    }

    const isPremium = wallet.subscription_tier === 'premium' && 
                      (!wallet.subscription_expires_at || new Date(wallet.subscription_expires_at) > new Date());
    
    // Tổng lượt dùng
    const totalBalance = isPremium ? 'Vô cực' : ((wallet.balance || 0) + (wallet.daily_credits || 0));

    return new Response(JSON.stringify({ 
        balance: totalBalance, 
        isPremium, 
        daily_credits: wallet.daily_credits, 
        purchased_credits: wallet.balance,
        success: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Lỗi lấy balance:", error);
    return new Response(JSON.stringify({ error: 'System error' }), { status: 500 });
  }
};
