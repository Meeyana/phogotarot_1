import type { APIRoute } from 'astro';
import { Google, OAuth2Tokens } from 'arctic';
import { createSession, setSessionCookie } from '../../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env: any = context.locals.runtime?.env || process.env || import.meta.env;
  const db = env.DB;
  
  if (!db) return new Response('Database not available', { status: 500 });

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI || `${context.url.origin}/api/auth/google/callback`;

  const google = new Google(clientId, clientSecret, redirectUri);

  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');
  const storedState = context.cookies.get('google_oauth_state')?.value ?? null;
  const storedCodeVerifier = context.cookies.get('google_oauth_code_verifier')?.value ?? null;

  if (!code || !state || !storedState || state !== storedState || !storedCodeVerifier) {
    return new Response('Lỗi xác thực Google OAuth. Vui lòng thử lại.', { status: 400 });
  }

  try {
    const tokens: OAuth2Tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
    const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    
    const googleUser = await googleUserResponse.json();
    const { sub: googleId, email, name, picture } = googleUser;

    // 1. Kiểm tra xem Provider này đã liên kết với User nào chưa?
    const existingProvider = await db.prepare('SELECT user_id FROM auth_providers WHERE provider = ? AND provider_user_id = ?')
      .bind('google', googleId).first();

    let userId = '';

    if (existingProvider) {
      // Đã từng đăng nhập Google
      userId = existingProvider.user_id as string;
    } else {
      // Chưa từng đăng nhập Google, kiểm tra xem Email đã tồn tại chưa
      const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      
      if (existingUser) {
        // Đồng bộ tài khoản (Link Account)
        userId = existingUser.id as string;
        // Liên kết Google vào tài khoản hiện tại
        await db.prepare('INSERT INTO auth_providers (id, user_id, provider, provider_user_id, access_token) VALUES (?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), userId, 'google', googleId, tokens.accessToken).run();
      } else {
        // Tạo tài khoản mới hoàn toàn
        userId = crypto.randomUUID();
        await db.prepare('INSERT INTO users (id, email) VALUES (?, ?)')
          .bind(userId, email).run();
          
        await db.prepare('INSERT INTO user_profiles (user_id, full_name) VALUES (?, ?)')
          .bind(userId, name).run();
        
        await db.prepare('INSERT INTO auth_providers (id, user_id, provider, provider_user_id, access_token) VALUES (?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), userId, 'google', googleId, tokens.accessToken).run();
      }
    }

    // Tạo phiên đăng nhập
    const sessionId = await createSession(db, userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    setSessionCookie(context, sessionId, expiresAt);

    return context.redirect('/');
  } catch (error) {
    console.error('Google Auth Error:', error);
    return new Response('Đã có lỗi xảy ra khi đăng nhập bằng Google.', { status: 500 });
  }
};
