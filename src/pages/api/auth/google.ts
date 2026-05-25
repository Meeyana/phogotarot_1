import type { APIRoute } from 'astro';
import { Google } from 'arctic';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const env: any = context.locals.runtime?.env || process.env || import.meta.env;
  
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI || `${context.url.origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return new Response('Google OAuth is not configured.', { status: 500 });
  }

  const google = new Google(clientId, clientSecret, redirectUri);
  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID(); // Optional cho một số provider nhưng arctic có thể yêu cầu tuỳ version

  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ['profile', 'email']
  });

  // Lưu state và codeVerifier vào cookie để xác minh ở callback
  context.cookies.set('google_oauth_state', state, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax'
  });
  
  context.cookies.set('google_oauth_code_verifier', codeVerifier, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax'
  });

  return context.redirect(url.toString());
};
