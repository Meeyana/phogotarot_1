import type { APIRoute } from 'astro';
import { hashPassword } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { token, password } = body;

    if (!token || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'Thông tin không hợp lệ.' }), { status: 400 });
    }

    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Lỗi cấu hình CSDL.' }), { status: 500 });
    }

    // Kiểm tra token
    const resetRecord = await db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').bind(token).first();
    
    if (!resetRecord) {
      return new Response(JSON.stringify({ error: 'Liên kết không hợp lệ hoặc đã được sử dụng.' }), { status: 400 });
    }

    // Kiểm tra hạn sử dụng (expires_at lưu dạng Unix timestamp theo giây)
    const now = Math.floor(Date.now() / 1000);
    if (now > resetRecord.expires_at) {
      return new Response(JSON.stringify({ error: 'Liên kết đã hết hạn. Vui lòng yêu cầu lại.' }), { status: 400 });
    }

    // Mã hóa mật khẩu mới
    const newPasswordHash = await hashPassword(password, env);

    // Cập nhật mật khẩu trong bảng users và đánh dấu token đã dùng
    const batch = [
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newPasswordHash, resetRecord.user_id),
      db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(resetRecord.id)
    ];

    await db.batch(batch);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("Lỗi Reset Password:", error);
    return new Response(JSON.stringify({ error: 'Đã có lỗi hệ thống xảy ra.' }), { status: 500 });
  }
};
