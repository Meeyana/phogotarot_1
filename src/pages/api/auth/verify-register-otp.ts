import type { APIRoute } from 'astro';
import { createSession, setSessionCookie, hashPassword } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const db = context.locals.runtime?.env?.DB;
    const env = context.locals.runtime?.env || process.env || import.meta.env;
    
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }

    const { email, password, name, otp } = await context.request.json();

    if (!email || !password || !name || !otp) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin xác thực' }), { status: 400 });
    }

    // Lấy OTP từ DB (cần có attempts)
    const otpRecord = await db.prepare('SELECT id, otp_code, expires_at, attempts FROM otp_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1')
      .bind(email)
      .first();

    if (!otpRecord) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy mã xác nhận cho email này.' }), { status: 400 });
    }

    // 1. Kiểm tra giới hạn 20 lần toàn bộ
    const totalFailed = await db.prepare('SELECT SUM(attempts) as total FROM otp_codes WHERE email = ?').bind(email).first();
    if (totalFailed && totalFailed.total >= 20) {
      return new Response(JSON.stringify({ error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.' }), { status: 400 });
    }

    // 2. Kiểm tra giới hạn 10 lần cho mã OTP này
    if (otpRecord.attempts >= 10) {
      return new Response(JSON.stringify({ error: 'Bạn đã thử quá nhiều lần đối với mã này, vui lòng gửi lại mã mới.' }), { status: 400 });
    }

    // Kiểm tra mã OTP (hỗ trợ cả mã cũ đang lưu dạng plain text 6 số và mã mới dạng hash)
    let isOtpValid = false;
    if (otpRecord.otp_code.length === 6) {
      isOtpValid = (otpRecord.otp_code === otp);
    } else {
      const { verifyPassword } = await import('../../../lib/auth');
      isOtpValid = await verifyPassword(otp, otpRecord.otp_code);
    }

    if (!isOtpValid) {
      // Tăng số lần thử sai
      await db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').bind(otpRecord.id).run();
      return new Response(JSON.stringify({ error: 'Mã OTP sai, vui lòng kiểm tra và nhập lại.' }), { status: 400 });
    }

    // Kiểm tra hết hạn
    const now = Math.floor(Date.now() / 1000);
    if (now > otpRecord.expires_at) {
      return new Response(JSON.stringify({ error: 'Mã xác nhận đã hết hạn. Vui lòng gửi lại mã mới.' }), { status: 400 });
    }

    // Mã hợp lệ -> Tiến hành đăng ký
    // 1. Kiểm tra lại email tồn tại (phòng trường hợp race condition)
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

    // Tạo ví Credit cho user mới (1 lượt vĩnh viễn, 1 lượt daily = 2 lượt ngày đầu)
    await db.prepare('INSERT INTO credit_wallets (user_id, balance, daily_credits, last_daily_reset) VALUES (?, 1, 1, CURRENT_DATE)')
      .bind(userId)
      .run();

    // Xóa tất cả mã OTP của email này
    await db.prepare('DELETE FROM otp_codes WHERE email = ?').bind(email).run();

    // Tạo session đăng nhập tự động
    const sessionId = await createSession(db, userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    setSessionCookie(context, sessionId, expiresAt);

    return new Response(JSON.stringify({ success: true, redirect: '/' }), { status: 200 });
  } catch (error: any) {
    console.error('Lỗi xác thực OTP đăng ký:', error);
    return new Response(JSON.stringify({ error: 'Lỗi Database: ' + (error.message || JSON.stringify(error)) }), { status: 500 });
  }
};
