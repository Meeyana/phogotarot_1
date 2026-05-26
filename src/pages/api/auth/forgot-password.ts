import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Vui lòng nhập email.' }), { status: 400 });
    }

    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const db = env.DB;
    const resendApiKey = env.RESEND_API_KEY;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Lỗi cấu hình CSDL.' }), { status: 500 });
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Chưa cấu hình RESEND_API_KEY để gửi email.' }), { status: 500 });
    }

    // Kiểm tra email có tồn tại không
    const user = await db.prepare('SELECT id, password_hash FROM users WHERE email = ?').bind(email).first();
    
    if (!user) {
      // Để bảo mật, không báo lỗi nếu email không tồn tại, cứ báo thành công
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Nếu user đăng ký bằng Google (password_hash = null), báo lỗi để họ đăng nhập qua Google
    if (!user.password_hash) {
      return new Response(JSON.stringify({ error: 'Tài khoản này được tạo qua Google. Vui lòng chọn "Tiếp tục với Google" ở trang đăng nhập.' }), { status: 400 });
    }

    // Tạo token đặt lại mật khẩu
    const token = crypto.randomUUID() + crypto.randomUUID(); // Token dài để an toàn
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token có hạn 1 tiếng

    await db.prepare(`
      INSERT INTO password_resets (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(crypto.randomUUID(), user.id, token, Math.floor(expiresAt.getTime() / 1000)).run();

    // Tạo link khôi phục
    const origin = new URL(context.request.url).origin;
    const resetLink = `${origin}/reset-password?token=${token}`;

    // Gửi email qua Resend API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Phở Gõ Tarot <noreply@phogotarot.com>', // Yêu cầu bạn đã verify domain phogotarot.com trên Resend. Nếu chưa, hãy dùng email mặc định của Resend cung cấp lúc test.
        to: email,
        subject: 'Đặt lại mật khẩu - Phở Gõ Tarot',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Yêu cầu đặt lại mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này.</p>
            <p>Vui lòng bấm vào nút dưới đây để tạo mật khẩu mới. Liên kết này sẽ hết hạn sau 1 giờ.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #D4AF37; color: #050A1F; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">ĐẶT LẠI MẬT KHẨU</a>
            </div>
            <p>Hoặc copy đường dẫn này dán vào trình duyệt:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, xin hãy bỏ qua email này.</p>
          </div>
        `
      })
    });

    if (!resendRes.ok) {
      const errorText = await resendRes.text();
      console.error("Resend Error:", errorText);
      return new Response(JSON.stringify({ error: 'Không thể gửi email. Vui lòng liên hệ Admin.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("Lỗi Forgot Password:", error);
    return new Response(JSON.stringify({ error: 'Đã có lỗi hệ thống xảy ra.' }), { status: 500 });
  }
};
