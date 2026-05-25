import { defineMiddleware } from 'astro:middleware';
import { validateSession, setSessionCookie, SESSION_COOKIE_NAME, deleteSession } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionId = context.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const db = context.locals.runtime?.env?.DB;

  if (!db) {
    // Nếu chạy local hoặc build time không có DB, cho qua tạm
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  if (!sessionId) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  const { session, user } = await validateSession(db, sessionId);

  if (session && session.expiresAt) {
    // Gia hạn cookie nếu session còn hiệu lực (hàm validateSession đã xử lý logic cập nhật thời gian)
    setSessionCookie(context, session.id, session.expiresAt);
  } else {
    // Nếu session không hợp lệ, xóa cookie
    context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  }

  context.locals.session = session;
  context.locals.user = user;

  // Bảo vệ route: Nếu user vào trang yêu cầu login mà chưa login
  const url = new URL(context.request.url);
  const protectedRoutes = ['/xem-tarot', '/yes-no-reading', '/chat', '/profile'];
  
  const isProtected = protectedRoutes.some(route => url.pathname.startsWith(route));
  if (isProtected && !user) {
    return context.redirect('/login');
  }

  return next();
});
