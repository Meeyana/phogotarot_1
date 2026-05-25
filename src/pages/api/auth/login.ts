import type { APIRoute } from 'astro';
import { createSession, setSessionCookie, hashPassword } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const db = context.locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }

    const { email, password } = await context.request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Vui lòng nhập email và mật khẩu' }), { status: 400 });
    }

    // Tìm user
    const user = await db.prepare('SELECT id, password_hash FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Email hoặc mật khẩu không chính xác' }), { status: 400 });
    }

    if (!user.password_hash) {
      return new Response(JSON.stringify({ error: 'Tài khoản này được đăng nhập qua Google/Facebook. Vui lòng sử dụng tính năng Đăng nhập mạng xã hội.' }), { status: 400 });
    }

    // Kiểm tra mật khẩu
    const hash = await hashPassword(password);
    if (hash !== user.password_hash) {
      return new Response(JSON.stringify({ error: 'Email hoặc mật khẩu không chính xác' }), { status: 400 });
    }

    // Tạo session
    const sessionId = await createSession(db, user.id as string);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    setSessionCookie(context, sessionId, expiresAt);

    return new Response(JSON.stringify({ success: true, redirect: '/' }), { status: 200 });
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error);
    return new Response(JSON.stringify({ error: 'Đã có lỗi xảy ra, vui lòng thử lại' }), { status: 500 });
  }
};
