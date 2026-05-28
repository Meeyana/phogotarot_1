import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * SePay Webhook Endpoint
 * URL cấu hình trong SePay: https://yourdomain.com/api/payment/sepay-webhook
 * 
 * SePay sẽ gửi POST request với payload:
 * {
 *   id: number,
 *   gateway: string,          // tên ngân hàng
 *   transactionDate: string,  // "2024-07-02 11:08:33"
 *   accountNumber: string,    // số tài khoản nhận
 *   transferType: "in"|"out",
 *   transferAmount: number,   // số tiền (VND)
 *   content: string,          // nội dung chuyển khoản (chứa transaction_id)
 *   referenceCode: string,    // mã tham chiếu từ ngân hàng
 *   code: string|null,        // mã đơn hàng nếu SePay parse được
 *   subCode: string|null,
 *   description: string|null,
 *   metadata: object|null,
 * }
 */

export const POST: APIRoute = async (context) => {
  try {
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), { status: 500 });
    }

    // === Xác thực API Key từ SePay (nếu có cấu hình) ===
    // SePay gửi header: Authorization: Apikey YOUR_API_KEY
    const sepayApiKey = env.SEPAY_API_KEY || import.meta.env.SEPAY_API_KEY;
    if (sepayApiKey) {
      const authHeader = context.request.headers.get('Authorization') || '';
      const incomingKey = authHeader.replace('Apikey ', '').trim();
      if (incomingKey !== sepayApiKey) {
        console.warn('[SePay Webhook] Unauthorized: invalid API key');
        return new Response(JSON.stringify({ success: false }), { status: 401 });
      }
    }

    const body = await context.request.json();
    console.log('[SePay Webhook] Received:', JSON.stringify(body));

    const { transferType, transferAmount, content, id: sePayTxId } = body;

    // Chỉ xử lý giao dịch tiền vào
    if (transferType !== 'in') {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (!transferAmount || !content) {
      return new Response(JSON.stringify({ success: false, error: 'Thiếu thông tin giao dịch' }), { status: 400 });
    }

    // === Tìm transaction_id (PGTxxxxxx) trong nội dung chuyển khoản ===
    // Nội dung có thể là: "PGTRWKI6Z chuyen tien" hoặc chỉ "PGTRWKI6Z"
    const contentStr = String(content).toUpperCase();
    const match = contentStr.match(/PGT[A-Z0-9]{6,}/);

    if (!match) {
      // Không tìm thấy mã giao dịch trong nội dung - bỏ qua
      console.warn('[SePay Webhook] No transaction code found in content:', content);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const transactionCode = match[0];
    console.log('[SePay Webhook] Found transaction code:', transactionCode, '| Amount:', transferAmount);

    // === Tìm đơn hàng trong DB ===
    const request = await db
      .prepare('SELECT * FROM payment_requests WHERE id = ? AND status = ?')
      .bind(transactionCode, 'pending')
      .first();

    if (!request) {
      console.warn('[SePay Webhook] Order not found or already processed:', transactionCode);
      // Trả về success để SePay không retry (đơn đã xử lý rồi)
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // === Kiểm tra số tiền ===
    if (parseInt(transferAmount) < request.amount) {
      console.warn('[SePay Webhook] Amount insufficient:', transferAmount, '<', request.amount);
      return new Response(JSON.stringify({ success: false, error: 'Số tiền chuyển không đủ' }), { status: 400 });
    }

    // === Atomic update trạng thái đơn hàng (chặn race condition) ===
    const updateResult = await db
      .prepare('UPDATE payment_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?')
      .bind('paid', transactionCode, 'pending')
      .run();

    if (updateResult.meta && updateResult.meta.changes === 0) {
      // Đã được xử lý bởi luồng khác
      console.warn('[SePay Webhook] Duplicate webhook for:', transactionCode);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const userId = request.user_id;
    const reqAmount = request.amount;

    // === Đảm bảo wallet tồn tại ===
    const wallet = await db.prepare('SELECT * FROM credit_wallets WHERE user_id = ?').bind(userId).first();
    if (!wallet) {
      await db.prepare('INSERT INTO credit_wallets (user_id, balance, daily_credits) VALUES (?, 0, 1)').bind(userId).run();
    }

    const crypto = globalThis.crypto;

    // === Cộng Credit theo gói ===
    if (reqAmount === 49000) {
      await db.prepare('UPDATE credit_wallets SET balance = balance + 3 WHERE user_id = ?').bind(userId).run();
      await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 3, 'purchase', 'Nạp thẻ gói 49K (SePay)')`).bind(crypto.randomUUID(), userId).run();
      console.log('[SePay Webhook] +3 credits for user:', userId);
    } else if (reqAmount === 129000) {
      await db.prepare('UPDATE credit_wallets SET balance = balance + 10 WHERE user_id = ?').bind(userId).run();
      await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 10, 'purchase', 'Nạp thẻ gói 129K (SePay)')`).bind(crypto.randomUUID(), userId).run();
      console.log('[SePay Webhook] +10 credits for user:', userId);
    } else if (reqAmount === 199000) {
      const expiresAt = new Date(new Date().getTime() + 7 * 3600 * 1000);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      const expStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19) + '+07:00';
      await db.prepare('UPDATE credit_wallets SET subscription_tier = ?, subscription_expires_at = ? WHERE user_id = ?').bind('premium', expStr, userId).run();
      await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 0, 'purchase', 'Mua gói Premium 1 Tháng (SePay)')`).bind(crypto.randomUUID(), userId).run();
      console.log('[SePay Webhook] Premium 1 month for user:', userId);
    } else if (reqAmount === 599000) {
      const expiresAt = new Date(new Date().getTime() + 7 * 3600 * 1000);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const expStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19) + '+07:00';
      await db.prepare('UPDATE credit_wallets SET subscription_tier = ?, subscription_expires_at = ? WHERE user_id = ?').bind('premium', expStr, userId).run();
      await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 0, 'purchase', 'Mua gói Premium 1 Năm (SePay)')`).bind(crypto.randomUUID(), userId).run();
      console.log('[SePay Webhook] Premium 1 year for user:', userId);
    } else if (reqAmount === 799000) {
      await db.prepare('UPDATE credit_wallets SET subscription_tier = ?, subscription_expires_at = NULL WHERE user_id = ?').bind('premium', userId).run();
      await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 0, 'purchase', 'Mua gói Premium Trọn Đời (SePay)')`).bind(crypto.randomUUID(), userId).run();
      console.log('[SePay Webhook] Premium lifetime for user:', userId);
    }

    // SePay yêu cầu trả về { success: true } trong body
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[SePay Webhook] Error:', error);
    // Trả về 500 để SePay retry
    return new Response(JSON.stringify({ success: false, error: 'System error' }), { status: 500 });
  }
};
