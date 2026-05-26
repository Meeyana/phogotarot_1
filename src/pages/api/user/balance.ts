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

    const wallet = await db.prepare('SELECT balance FROM credit_wallets WHERE user_id = ?').bind(user.id).first();
    const balance = wallet ? wallet.balance : 0;

    return new Response(JSON.stringify({ balance, success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error("Lỗi lấy balance:", error);
    return new Response(JSON.stringify({ error: 'System error' }), { status: 500 });
  }
};
