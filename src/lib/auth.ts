import type { APIContext } from 'astro';

export const SESSION_COOKIE_NAME = 'phogo_session';
export const SESSION_EXPIRES_IN_DAYS = 30;

// Tạo Session ID ngẫu nhiên
export function generateSessionId(): string {
  return crypto.randomUUID();
}

// Lưu session vào DB
export async function createSession(db: any, userId: string): Promise<string> {
  const sessionId = generateSessionId();
  // Tính ngày hết hạn (30 ngày sau)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRES_IN_DAYS);
  
  await db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, Math.floor(expiresAt.getTime() / 1000))
    .run();
    
  return sessionId;
}

// Xác thực session
export async function validateSession(db: any, sessionId: string) {
  const result = await db.prepare(`
    SELECT sessions.*, users.id as user_id, users.email, user_profiles.full_name as name 
    FROM sessions 
    INNER JOIN users ON sessions.user_id = users.id 
    LEFT JOIN user_profiles ON sessions.user_id = user_profiles.user_id
    WHERE sessions.id = ?
  `).bind(sessionId).first();

  if (!result) {
    return { session: null, user: null };
  }

  const session = {
    id: result.id,
    userId: result.user_id,
    expiresAt: new Date(result.expires_at * 1000)
  };

  const user = {
    id: result.user_id,
    email: result.email,
    name: result.name,
    avatar: null,
    role: 'user'
  };

  // Kiểm tra hết hạn
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return { session: null, user: null };
  }

  // Gia hạn session nếu sắp hết hạn (còn dưới 15 ngày)
  const fifteenDays = 1000 * 60 * 60 * 24 * 15;
  if (session.expiresAt.getTime() - Date.now() < fifteenDays) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + SESSION_EXPIRES_IN_DAYS);
    await db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?')
      .bind(Math.floor(newExpiresAt.getTime() / 1000), sessionId)
      .run();
    session.expiresAt = newExpiresAt;
  }

  return { session, user };
}

// Set cookie
export function setSessionCookie(context: APIContext, sessionId: string, expiresAt: Date) {
  context.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    expires: expiresAt
  });
}

// Xóa cookie & session trong DB
export async function deleteSession(context: APIContext, db: any) {
  const sessionId = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

// Băm mật khẩu sử dụng Web Crypto API (Nhanh và không bị giới hạn CPU trên Cloudflare Workers)
export async function hashPassword(password: string, envObj?: any): Promise<string> {
  const encoder = new TextEncoder();
  
  // Ưu tiên đọc biến môi trường truyền vào từ context, nếu không có thì fallback sang process.env / import.meta.env
  const env = envObj || (typeof process !== 'undefined' ? process.env : null) || import.meta.env || {};
  
  // Đọc biến PASSWORD_SALT từ môi trường, nếu chưa set thì dùng mã mặc định cũ để tránh làm lỗi các mật khẩu hiện tại
  const salt = env.PASSWORD_SALT || 'phogo_tarot_secret_salt_2026';
  
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

