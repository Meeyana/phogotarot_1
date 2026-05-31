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
    SELECT sessions.*, users.id as user_id, users.email, credit_wallets.subscription_expires_at as premium_until, credit_wallets.balance, credit_wallets.daily_credits, user_profiles.full_name as name 
    FROM sessions 
    INNER JOIN users ON sessions.user_id = users.id 
    LEFT JOIN user_profiles ON sessions.user_id = user_profiles.user_id
    LEFT JOIN credit_wallets ON sessions.user_id = credit_wallets.user_id
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
    role: 'user',
    premiumUntil: result.premium_until ? new Date(result.premium_until) : null,
    credits: (result.balance || 0) + (result.daily_credits || 0)
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

// Hàm hash mật khẩu cũ (Legacy SHA-256)
export async function legacyHashPassword(password: string, envObj?: any): Promise<string> {
  const encoder = new TextEncoder();
  const env = envObj || (typeof process !== 'undefined' ? process.env : null) || import.meta.env || {};
  const salt = env.PASSWORD_SALT || 'phogo_tarot_secret_salt_2026';
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Băm mật khẩu an toàn sử dụng PBKDF2
export async function hashPassword(password: string, envObj?: any): Promise<string> {
  const encoder = new TextEncoder();
  const env = envObj || (typeof process !== 'undefined' ? process.env : null) || import.meta.env || {};
  const salt = env.PASSWORD_SALT || 'phogo_tarot_secret_salt_2026';
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:100000:${hexHash}`;
}

// Kiểm tra mật khẩu (hỗ trợ cả mã cũ SHA-256 và mã mới PBKDF2)
export async function verifyPassword(password: string, storedHash: string, envObj?: any, db?: any, userId?: string): Promise<boolean> {
  // Hash cũ SHA-256 có đúng 64 ký tự hex và không chứa dấu ":"
  const isLegacy = storedHash.length === 64 && !storedHash.includes(':');
  
  if (isLegacy) {
    const legacyHash = await legacyHashPassword(password, envObj);
    if (legacyHash === storedHash) {
      // Mật khẩu đúng, nếu có DB và User ID thì ngầm nâng cấp Hash lên PBKDF2
      if (db && userId) {
        try {
           const newHash = await hashPassword(password, envObj);
           await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, userId).run();
        } catch (e) {
           console.error('Lỗi khi tự động nâng cấp password hash:', e);
        }
      }
      return true;
    }
    return false;
  }
  
  // Kiểm tra Hash mới chuẩn PBKDF2
  if (storedHash.startsWith('pbkdf2:')) {
    const newHash = await hashPassword(password, envObj);
    return newHash === storedHash;
  }
  
  return false;
}

// Kiểm tra xem user có mở khóa hồ sơ thần số học chưa
export async function hasUnlockedProfile(db: any, userId: string, profileId: string, legacyProfileId?: string): Promise<boolean> {
  let result = await db.prepare('SELECT id FROM unlocked_numerology_profiles WHERE user_id = ? AND profile_id = ?')
    .bind(userId, profileId)
    .first();
    
  if (!result && legacyProfileId) {
      result = await db.prepare('SELECT id FROM unlocked_numerology_profiles WHERE user_id = ? AND profile_id = ?')
        .bind(userId, legacyProfileId)
        .first();
  }
  return !!result;
}

