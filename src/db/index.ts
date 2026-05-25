import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDB(context: any) {
  // context.locals.runtime.env.DB is provided by @astrojs/cloudflare
  const d1 = context.locals.runtime?.env?.DB || process.env.DB;
  if (!d1) {
    throw new Error('D1 database binding "DB" is not available in the current environment.');
  }
  return drizzle(d1, { schema });
}
