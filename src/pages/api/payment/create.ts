import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const user = context.locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();
    const { amount, package_id } = body;

    if (!amount || !package_id) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin gói nạp' }), { status: 400 });
    }

    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    // Sinh mã ngẫu nhiên: PGT + 6 ký tự viết hoa/số
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `PGT${randomStr}`;

    await db.prepare(`
        INSERT INTO payment_requests (id, user_id, package_id, amount, status) 
        VALUES (?, ?, ?, ?, 'pending')
    `).bind(transactionId, user.id, package_id, parseInt(amount)).run();

    return new Response(JSON.stringify({ 
      success: true, 
      transaction_id: transactionId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Lỗi tạo payment:", error);
    return new Response(JSON.stringify({ error: 'System error' }), { status: 500 });
  }
};
