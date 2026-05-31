import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const user = context.locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();
    const { package_id } = body;

    if (!package_id) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin gói nạp' }), { status: 400 });
    }

    const env: any = context.locals.runtime?.env ?? {};
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    // Lấy thông tin gói nạp từ Database bảng packages
    const packageRecord = await db.prepare('SELECT price, is_active FROM packages WHERE id = ?').bind(package_id).first();
    
    if (!packageRecord || !packageRecord.is_active) {
      return new Response(JSON.stringify({ error: 'Gói nạp không tồn tại hoặc đã ngừng bán' }), { status: 400 });
    }
    
    const serverAmount = packageRecord.price;

    // Kiểm tra nếu đã có đơn hàng pending cho cùng user + package trong 20 phút
    const existing = await db.prepare(`
      SELECT id, created_at FROM payment_requests 
      WHERE user_id = ? AND package_id = ? AND status = 'pending'
        AND created_at > datetime('now', '-20 minutes')
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(user.id, package_id).first();

    if (existing) {
      // Reuse transaction ID cũ
      console.log('[Payment Create] Reusing existing transaction:', existing.id, 'for user:', user.id);
      return new Response(JSON.stringify({ 
        success: true, 
        transaction_id: existing.id,
        created_at: existing.created_at, // UTC string e.g. "2024-05-28 12:34:56"
        reused: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Tạo mới: PGT + 6 ký tự viết hoa/số
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `PGT${randomStr}`;

    await db.prepare(`
        INSERT INTO payment_requests (id, user_id, package_id, amount, status) 
        VALUES (?, ?, ?, ?, 'pending')
    `).bind(transactionId, user.id, package_id, serverAmount).run();

    // Query lại để lấy created_at chính xác do SQLite tự sinh
    const newReq = await db.prepare('SELECT created_at FROM payment_requests WHERE id = ?').bind(transactionId).first();

    console.log('[Payment Create] New transaction:', transactionId, 'for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      transaction_id: transactionId,
      created_at: newReq?.created_at,
      reused: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Lỗi tạo payment:', error?.message);
    return new Response(JSON.stringify({ error: 'System error' }), { status: 500 });
  }
};
