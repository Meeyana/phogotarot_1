import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { createSession, setSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const db = context.locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }

    const { email, password, name } = await context.request.json();

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin đăng ký' }), { status: 400 });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Mật khẩu phải từ 6 ký tự trở lên' }), { status: 400 });
    }

    // Kiểm tra email tồn tại
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email đã được sử dụng' }), { status: 400 });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user
    await db.prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, email, name, passwordHash, 'user')
      .run();

    // Tạo session
    const sessionId = await createSession(db, userId);
    
    // Calculate expiration date matching auth.ts
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    setSessionCookie(context, sessionId, expiresAt);

    return new Response(JSON.stringify({ success: true, redirect: '/' }), { status: 200 });
  } catch (error: any) {
    console.error('Lỗi đăng ký:', error);
    return new Response(JSON.stringify({ error: 'Đã có lỗi xảy ra, vui lòng thử lại' }), { status: 500 });
  }
};
