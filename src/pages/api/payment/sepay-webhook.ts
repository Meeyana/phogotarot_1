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
    const env: any = context.locals.runtime?.env ?? {};
    if (import.meta.env.DEV) {
      console.log('[SePay Webhook] ENV keys:', Object.keys(env));
    }

    const db = env.DB;
    if (!db) {
      console.error('[SePay Webhook] DB not found in env');
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), { status: 500 });
    }

    // === Xác thực API Key từ SePay ===
    const sepayApiKey = env.SEPAY_API_KEY;
    if (!sepayApiKey) {
      console.error('[SePay Webhook] SEPAY_API_KEY is missing on server!');
      return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration' }), { status: 500 });
    }

    const authHeader = context.request.headers.get('Authorization') || '';
    const incomingKey = authHeader.replace(/^apikey\s+/i, '').trim();
    if (incomingKey !== sepayApiKey) {
      if (import.meta.env.DEV) {
        console.warn('[SePay Webhook] Unauthorized | authHeader:', authHeader);
      }
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
    }

    let body: any;
    try {
      body = await context.request.json();
    } catch (parseErr) {
      console.error('[SePay Webhook] Failed to parse JSON body');
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), { status: 400 });
    }

    if (import.meta.env.DEV) {
      console.log('[SePay Webhook] Received:', JSON.stringify(body));
    }

    const { transferType, transferAmount, content, code: sepayCode } = body;

    // Chỉ xử lý giao dịch tiền vào
    if (transferType !== 'in') {
      if (import.meta.env.DEV) console.log('[SePay Webhook] Skipped: transferType =', transferType);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (!transferAmount) {
      return new Response(JSON.stringify({ success: false, error: 'Thiếu thông tin giao dịch' }), { status: 400 });
    }

    // === Tìm transaction_id (PGTxxxxxx) ===
    let transactionCode: string | null = null;

    if (sepayCode && String(sepayCode).toUpperCase().startsWith('PGT')) {
      transactionCode = String(sepayCode).toUpperCase();
    } else {
      const contentStr = String(content || '').toUpperCase();
      const match = contentStr.match(/PGT[A-Z0-9]{6,}/);
      if (match) {
        transactionCode = match[0];
      }
    }

    if (!transactionCode) {
      if (import.meta.env.DEV) console.warn('[SePay Webhook] No PGT code found');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    
    if (import.meta.env.DEV) {
      console.log('[SePay Webhook] Processing PGT Code:', transactionCode);
    }

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
      
      // Đánh dấu đơn hàng là nạp thiếu tiền để báo cho frontend
      await db
        .prepare('UPDATE payment_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind('insufficient', transactionCode)
        .run();

      // Trả về 200 để SePay không gửi lại webhook (vì lỗi này do user chuyển sai, không phải lỗi server)
      return new Response(JSON.stringify({ success: true, message: 'Insufficient amount' }), { status: 200 });
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

    // Lấy thông tin gói nạp từ Database
    const packageRecord = await db.prepare('SELECT * FROM packages WHERE id = ?').bind(request.package_id).first();
    if (!packageRecord) {
      console.error('[SePay Webhook] Package not found in DB:', request.package_id);
      return new Response(JSON.stringify({ success: false, error: 'Package not found' }), { status: 400 });
    }

    // === Cộng Credit / Gói VIP dựa trên thông tin DB ===
    if (packageRecord.type === 'pack') {
      const creditsToAdd = packageRecord.credits;
      await db.prepare('UPDATE credit_wallets SET balance = balance + ? WHERE user_id = ?').bind(creditsToAdd, userId).run();
      const packageName = PACKAGE_DISPLAY_NAMES[packageRecord.id] || PACKAGE_DISPLAY_NAMES[packageRecord.name] || packageRecord.name;
      await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, ?, 'purchase', ?)`).bind(crypto.randomUUID(), userId, creditsToAdd, `Mua gói ${packageName} (SePay)`).run();
      if (import.meta.env.DEV) console.log(`[SePay Webhook] +${creditsToAdd} credits for user:`, userId);
    } else if (packageRecord.type === 'subscription') {
      let expiresAt: Date | null = new Date(new Date().getTime() + 7 * 3600 * 1000); // VN Time
      let expStr: string | null = null;
      
      if (packageRecord.id === 'Gói Tháng' || packageRecord.id === 'Vương Giả (Gói Tháng)') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        expStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19) + '+07:00';
      } else if (packageRecord.id === 'Gói Năm' || packageRecord.id === 'Chuyên Gia (Gói Năm)') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        expStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19) + '+07:00';
      } else if (packageRecord.id === 'Gói Trọn Đời' || packageRecord.id === 'Khai Sáng (Trọn Đời)') {
        expStr = null; // NULL nghĩa là vĩnh viễn
      }

      await db.prepare('UPDATE credit_wallets SET subscription_tier = ?, subscription_expires_at = ? WHERE user_id = ?').bind('premium', expStr, userId).run();
      const packageName = PACKAGE_DISPLAY_NAMES[packageRecord.id] || PACKAGE_DISPLAY_NAMES[packageRecord.name] || packageRecord.name;
      await db.prepare(`INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, 0, 'purchase', ?)`).bind(crypto.randomUUID(), userId, `Mua gói ${packageName} (SePay)`).run();
      if (import.meta.env.DEV) console.log(`[SePay Webhook] Premium (${packageRecord.id}) for user:`, userId);
    }

    // SePay yêu cầu trả về { success: true } trong body
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[SePay Webhook] UNHANDLED ERROR:', error?.message, error?.stack);
    return new Response(JSON.stringify({ success: false, error: 'System error' }), { status: 500 });
  }
};
