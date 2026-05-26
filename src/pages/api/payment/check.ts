import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const user = context.locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();
    const { transaction_id } = body;

    if (!transaction_id) {
      return new Response(JSON.stringify({ error: 'Thiếu transaction_id' }), { status: 400 });
    }

    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
    }

    const request = await db.prepare('SELECT status FROM payment_requests WHERE id = ? AND user_id = ?').bind(transaction_id, user.id).first();

    if (!request) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy đơn hàng' }), { status: 404 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      status: request.status 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Lỗi check payment:", error);
    return new Response(JSON.stringify({ error: 'System error' }), { status: 500 });
  }
};
