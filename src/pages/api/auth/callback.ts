import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createSession, setSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') || '/';

    if (!code) {
      return new Response('Mã xác thực (code) không hợp lệ', { status: 400 });
    }

    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const supabaseUrl = env.PUBLIC_SUPABASE_URL;
    const supabaseKey = env.PUBLIC_SUPABASE_ANON_KEY;
    const db = env.DB;

    if (!supabaseUrl || !supabaseKey || !db) {
      return new Response('Server configuration missing', { status: 500 });
    }

    // Khởi tạo Supabase Client (không cần tự động lưu session vì ta sẽ dùng D1 Session)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // 1. Đổi code lấy session từ Supabase
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError || !authData.user) {
      console.error('Supabase Auth Error:', authError);
      return new Response('Lỗi xác thực với Google: ' + (authError?.message || 'Unknown'), { status: 400 });
    }

    const user = authData.user;
    const email = user.email;
    const providerUserId = user.id; // Supabase user ID
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Lữ khách';
    
    if (!email) {
      return new Response('Không thể lấy email từ tài khoản Google.', { status: 400 });
    }

    // 2. Đồng nhất tài khoản với D1 Database
    // Kiểm tra xem email này đã từng đăng ký chưa
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    let finalUserId = '';

    if (existingUser) {
      // TÀI KHOẢN ĐÃ TỒN TẠI: Dùng chung user_id cũ
      finalUserId = existingUser.id;
      
      // Kiểm tra xem đã link provider google chưa
      const existingProvider = await db.prepare('SELECT id FROM auth_providers WHERE user_id = ? AND provider = ?').bind(finalUserId, 'google').first();
      
      if (!existingProvider) {
        // Liên kết tài khoản google mới vào user cũ
        await db.prepare(`
          INSERT INTO auth_providers (id, user_id, provider, provider_user_id) 
          VALUES (?, ?, ?, ?)
        `).bind(crypto.randomUUID(), finalUserId, 'google', providerUserId).run();
      }
    } else {
      // TÀI KHOẢN CHƯA TỒN TẠI: Tạo mới 100%
      finalUserId = crypto.randomUUID();
      
      // Tạo bản ghi users
      await db.prepare(`
        INSERT INTO users (id, email) 
        VALUES (?, ?)
      `).bind(finalUserId, email).run();

      // Tạo bản ghi user_profiles
      await db.prepare(`
        INSERT INTO user_profiles (user_id, full_name, nickname) 
        VALUES (?, ?, ?)
      `).bind(finalUserId, fullName, fullName).run();

      // Liên kết auth_providers
      await db.prepare(`
        INSERT INTO auth_providers (id, user_id, provider, provider_user_id) 
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), finalUserId, 'google', providerUserId).run();

      // Thưởng Credit miễn phí cho người mới (nếu có bảng credit_wallets)
      try {
        await db.prepare(`
          INSERT INTO credit_wallets (user_id, balance) 
          VALUES (?, ?)
        `).bind(finalUserId, 10).run(); // Tặng 10 credit
      } catch (e) {
        // Có thể bảng chưa được tạo, bỏ qua
        console.log("Không thể tạo credit wallet:", e);
      }
    }

    // 3. Tạo Session cục bộ để dùng với Astro Middleware hiện tại
    const sessionId = await createSession(db, finalUserId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Theo config SESSION_EXPIRES_IN_DAYS = 30

    // 4. Set Cookie `phogo_session`
    setSessionCookie(context, sessionId, expiresAt);

    // 5. Chuyển hướng người dùng về trang chủ
    return context.redirect(next);

  } catch (error: any) {
    console.error("Lỗi Callback:", error);
    return new Response('Đã có lỗi hệ thống xảy ra: ' + error.message, { status: 500 });
  }
};
