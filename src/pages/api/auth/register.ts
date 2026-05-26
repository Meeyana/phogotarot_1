import type { APIRoute } from 'astro';
import { createSession, setSessionCookie, hashPassword } from '../../../lib/auth';

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
    const passwordHash = await hashPassword(password);

    // Tạo user
    await db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
      .bind(userId, email, passwordHash)
      .run();
      
    // Tạo user profile
    await db.prepare('INSERT INTO user_profiles (user_id, full_name) VALUES (?, ?)')
      .bind(userId, name)
      .run();

    // Tạo ví Credit cho user mới (10 lượt)
    await db.prepare('INSERT INTO credit_wallets (user_id, balance) VALUES (?, ?)')
      .bind(userId, 10)
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
    return new Response(JSON.stringify({ error: 'Lỗi Database: ' + (error.message || JSON.stringify(error)) }), { status: 500 });
  }
};
