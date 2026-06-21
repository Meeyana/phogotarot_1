import type { APIRoute } from 'astro';

export const prerender = false;

const PACKAGE_DISPLAY_NAMES: Record<string, string> = {
  'Khởi Đầu (3 lượt)': 'Gói 3 Credit',
  'Gói Khởi Đầu': 'Gói 3 Credit',
  'Đồng Hành (10 lượt)': 'Gói 10 Credit',
  'Gói Đồng Hành': 'Gói 10 Credit',
  'Vương Giả (Gói Tháng)': 'Gói Tháng',
  'Chuyên Gia (Gói Năm)': 'Gói Năm',
  'Khai Sáng (Trọn Đời)': 'Gói Trọn Đời',
};

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
    // 2. Xác định gói và cộng Credit tương ứng
    let wallet = await db.prepare('SELECT * FROM credit_wallets WHERE user_id = ?').bind(userId).first();
    if (!wallet) {
      await db.prepare('INSERT INTO credit_wallets (user_id, balance, daily_credits) VALUES (?, 0, 1)').bind(userId).run();
    }

    const crypto = globalThis.crypto;

    const packageRecord = await db.prepare('SELECT * FROM packages WHERE id = ?').bind(request.package_id).first();
    if (!packageRecord) {
      return new Response(JSON.stringify({ error: 'Package not found' }), { status: 400 });
    }

    if (packageRecord.type === 'pack') {
        const creditsToAdd = packageRecord.credits;
        const packageName = PACKAGE_DISPLAY_NAMES[packageRecord.id] || PACKAGE_DISPLAY_NAMES[packageRecord.name] || packageRecord.name;
        await db.prepare('UPDATE credit_wallets SET balance = balance + ? WHERE user_id = ?').bind(creditsToAdd, userId).run();
        await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, ?, 'purchase', ?)`).bind(crypto.randomUUID(), userId, creditsToAdd, `Mua gói ${packageName}`).run();
    } else if (packageRecord.type === 'subscription') {
        let expStr: string | null = null;
        const expiresAt = new Date(new Date().getTime() + 7 * 3600 * 1000);

        if (packageRecord.id === 'Gói Tháng' || packageRecord.id === 'Vương Giả (Gói Tháng)') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          expStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19) + '+07:00';
        } else if (packageRecord.id === 'Gói Năm' || packageRecord.id === 'Chuyên Gia (Gói Năm)') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          expStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19) + '+07:00';
        } else if (packageRecord.id === 'Gói Trọn Đời' || packageRecord.id === 'Khai Sáng (Trọn Đời)') {
          expStr = null;
        }

        await db.prepare('UPDATE credit_wallets SET subscription_tier = ?, subscription_expires_at = ? WHERE user_id = ?').bind('premium', expStr, userId).run();
        const packageName = PACKAGE_DISPLAY_NAMES[packageRecord.id] || PACKAGE_DISPLAY_NAMES[packageRecord.name] || packageRecord.name;
        await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 0, 'purchase', ?)`).bind(crypto.randomUUID(), userId, `Mua gói ${packageName}`).run();
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
