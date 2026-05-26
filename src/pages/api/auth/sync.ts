import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { createSession, setSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { access_token } = body;

    if (!access_token) {
      return new Response(JSON.stringify({ success: false, error: 'Thiếu access_token' }), { status: 400 });
    }

    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const supabaseUrl = env.PUBLIC_SUPABASE_URL;
    const supabaseKey = env.PUBLIC_SUPABASE_ANON_KEY;
    const db = env.DB;

    if (!supabaseUrl || !supabaseKey || !db) {
      return new Response(JSON.stringify({ success: false, error: 'Chưa cấu hình Supabase Server' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Xác thực token với Supabase Server để lấy thông tin user thật, chống giả mạo
    const { data: { user }, error: authError } = await supabase.auth.getUser(access_token);

    if (authError || !user || !user.email) {
      return new Response(JSON.stringify({ success: false, error: 'Token không hợp lệ' }), { status: 401 });
    }

    const email = user.email;
    const providerUserId = user.id;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Lữ khách';
    
    // 2. Đồng nhất tài khoản với D1 Database
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    let finalUserId = '';

    if (existingUser) {
      finalUserId = existingUser.id;
      
      const existingProvider = await db.prepare('SELECT id FROM auth_providers WHERE user_id = ? AND provider = ?').bind(finalUserId, 'google').first();
      
      if (!existingProvider) {
        await db.prepare(`
          INSERT INTO auth_providers (id, user_id, provider, provider_user_id) 
          VALUES (?, ?, ?, ?)
        `).bind(crypto.randomUUID(), finalUserId, 'google', providerUserId).run();
      }
    } else {
      finalUserId = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO users (id, email) 
        VALUES (?, ?)
      `).bind(finalUserId, email).run();

      await db.prepare(`
        INSERT INTO user_profiles (user_id, full_name, nickname) 
        VALUES (?, ?, ?)
      `).bind(finalUserId, fullName, fullName).run();

      await db.prepare(`
        INSERT INTO auth_providers (id, user_id, provider, provider_user_id) 
        VALUES (?, ?, ?, ?)
      `).bind(crypto.randomUUID(), finalUserId, 'google', providerUserId).run();

      try {
        await db.prepare(`
          INSERT INTO credit_wallets (user_id, balance, daily_credits, last_daily_reset) 
          VALUES (?, 1, 1, CURRENT_DATE)
        `).bind(finalUserId).run(); 
      } catch (e) {
        // Ignored
      }
    }

    // 3. Tạo Session cục bộ D1
    const sessionId = await createSession(db, finalUserId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 4. Set Cookie `phogo_session`
    setSessionCookie(context, sessionId, expiresAt);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("Lỗi Sync:", error);
    return new Response(JSON.stringify({ success: false, error: 'Đã có lỗi hệ thống' }), { status: 500 });
  }
};
