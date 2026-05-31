import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;
    const resendApiKey = env.RESEND_API_KEY;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Chưa cấu hình RESEND_API_KEY để gửi email.' }), { status: 500 });
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

    // Đảm bảo bảng otp_codes tồn tại và có cột attempts
    try {
        await db.prepare(`CREATE TABLE IF NOT EXISTS otp_codes (id TEXT PRIMARY KEY, email TEXT NOT NULL, otp_code TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
        try { await db.prepare(`ALTER TABLE otp_codes ADD COLUMN attempts INTEGER DEFAULT 0`).run(); } catch(e) {}
    } catch(e) { console.error(e); }

    // Kiểm tra nếu tổng số lần nhập sai >= 20 thì chặn gửi tiếp
    try {
      const totalFailed = await db.prepare('SELECT SUM(attempts) as total FROM otp_codes WHERE email = ?').bind(email).first();
      if (totalFailed && totalFailed.total >= 20) {
        return new Response(JSON.stringify({ error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.' }), { status: 400 });
      }
    } catch (e) { console.error(e); }

    // Tạo mã OTP 6 số
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 phút

    // Lưu OTP vào DB
    await db.prepare('INSERT INTO otp_codes (id, email, otp_code, expires_at) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), email, otpCode, expiresAt)
      .run();

    // Gửi email qua Resend API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Phở Gõ Tarot <no-reply@phogotarot.com>',
        to: email,
        subject: 'Mã xác nhận đăng ký tài khoản - Phở Gõ Tarot',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
            <h2>Mã Xác Nhận Đăng Ký</h2>
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Phở Gõ Tarot.</p>
            <p>Dưới đây là mã xác nhận (OTP) của bạn. Mã này có hiệu lực trong 5 phút:</p>
            <div style="margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #D4AF37; background: #050A1F; padding: 15px; border-radius: 8px;">
              ${otpCode}
            </div>
            <p>Vui lòng nhập mã này vào trang đăng ký để hoàn tất.</p>
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
          </div>
        `
      })
    });

    if (!resendRes.ok) {
      const errorText = await resendRes.text();
      console.error("Resend Error:", errorText);
      return new Response(JSON.stringify({ error: 'Không thể gửi email OTP. Vui lòng kiểm tra lại địa chỉ email.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Đã gửi mã OTP.' }), { status: 200 });
  } catch (error: any) {
    console.error('Lỗi send-register-otp:', error);
    return new Response(JSON.stringify({ error: 'Lỗi hệ thống: ' + (error.message || JSON.stringify(error)) }), { status: 500 });
  }
};
