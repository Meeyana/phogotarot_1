import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const db = context.locals.runtime?.env?.DB;
    if (db) {
      await deleteSession(context, db);
    }
    return context.redirect('/');
  } catch (error: any) {
    console.error('Lỗi đăng xuất:', error);
    return context.redirect('/');
  }
};
