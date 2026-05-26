import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;
    if (!db) return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });

    const body = await context.request.json();
    const { transaction_code, amount, secret } = body;

    // Bảo mật webhook bằng secret key cấu hình trong env
    const webhookSecret = env.WEBHOOK_SECRET || import.meta.env.WEBHOOK_SECRET;
    if (webhookSecret && secret !== webhookSecret) {
       return new Response('Unauthorized', { status: 401 });
    }

    if (!transaction_code || !amount) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin' }), { status: 400 });
    }

    const request = await db.prepare('SELECT * FROM payment_requests WHERE id = ? AND status = ?').bind(transaction_code, 'pending').first();

    if (!request) {
      return new Response(JSON.stringify({ error: 'Đơn hàng không tồn tại hoặc đã xử lý' }), { status: 404 });
    }

    if (parseInt(amount) < request.amount) {
      return new Response(JSON.stringify({ error: 'Số tiền chuyển không đủ' }), { status: 400 });
    }

    // 1. Cập nhật trạng thái đơn hàng một cách an toàn (Atomic Update chặn Race Condition)
    const updateResult = await db.prepare('UPDATE payment_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?').bind('paid', transaction_code, 'pending').run();
    
    // Nếu changes = 0 nghĩa là luồng khác đã update mất rồi, ngăn chặn việc cộng tiền 2 lần
    if (updateResult.meta && updateResult.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Giao dịch đã được xử lý (trùng lặp)' }), { status: 400 });
    }

    const userId = request.user_id;
    const reqAmount = request.amount;

    // 2. Xác định gói và cộng Credit tương ứng
    let wallet = await db.prepare('SELECT * FROM credit_wallets WHERE user_id = ?').bind(userId).first();
    if (!wallet) {
      await db.prepare('INSERT INTO credit_wallets (user_id, balance, daily_credits) VALUES (?, 0, 1)').bind(userId).run();
    }

    const crypto = globalThis.crypto;
    
    if (reqAmount === 49000) {
        // Cộng 3 lượt vĩnh viễn
        await db.prepare('UPDATE credit_wallets SET balance = balance + 3 WHERE user_id = ?').bind(userId).run();
        await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 3, 'purchase', 'Nạp thẻ gói 49K')`).bind(crypto.randomUUID(), userId).run();
    } else if (reqAmount === 129000) {
        // Cộng 10 lượt vĩnh viễn
        await db.prepare('UPDATE credit_wallets SET balance = balance + 10 WHERE user_id = ?').bind(userId).run();
        await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 10, 'purchase', 'Nạp thẻ gói 129K')`).bind(crypto.randomUUID(), userId).run();
    } else if (reqAmount === 199000) {
        // Premium 1 tháng
        const expiresAt = new Date(new Date().getTime() + 7 * 3600 * 1000);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        const expStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19) + '+07:00';
        await db.prepare('UPDATE credit_wallets SET subscription_tier = ?, subscription_expires_at = ? WHERE user_id = ?').bind('premium', expStr, userId).run();
        await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 0, 'purchase', 'Mua gói Premium 1 Tháng')`).bind(crypto.randomUUID(), userId).run();
    } else if (reqAmount === 599000) {
        // Premium 1 năm
        const expiresAt = new Date(new Date().getTime() + 7 * 3600 * 1000);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        const expStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19) + '+07:00';
        await db.prepare('UPDATE credit_wallets SET subscription_tier = ?, subscription_expires_at = ? WHERE user_id = ?').bind('premium', expStr, userId).run();
        await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 0, 'purchase', 'Mua gói Premium 1 Năm')`).bind(crypto.randomUUID(), userId).run();
    } else if (reqAmount === 799000) {
        // Premium Trọn Đời (Không có ngày hết hạn)
        await db.prepare('UPDATE credit_wallets SET subscription_tier = ?, subscription_expires_at = NULL WHERE user_id = ?').bind('premium', userId).run();
        await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 0, 'purchase', 'Mua gói Premium Trọn Đời')`).bind(crypto.randomUUID(), userId).run();
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Đã cộng credit thành công'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Lỗi webhook payment:", error);
    return new Response(JSON.stringify({ error: 'System error' }), { status: 500 });
  }
};
