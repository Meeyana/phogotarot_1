import type { APIRoute } from 'astro';
import { getEffectivePackagePrice, type PackageRecord } from '../../lib/pricing';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const env: any = context.locals.runtime?.env ?? {};
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), { status: 500 });
    }

    const { results } = await db
      .prepare(`
        SELECT id, name, price, original_price, list_price, sale_price, sale_starts_at,
               sale_ends_at, credits, type, is_active
        FROM packages
        WHERE is_active = 1
        ORDER BY created_at ASC
      `)
      .all<PackageRecord>();

    const data = (results || []).map((pkg) => {
      const pricing = getEffectivePackagePrice(pkg);
      return {
        id: pkg.id,
        name: pkg.name,
        type: pkg.type,
        credits: pkg.credits,
        is_active: pkg.is_active,
        price: pricing.effectivePrice,
        list_price: pricing.listPrice,
        sale_price: pkg.sale_price ?? null,
        sale_starts_at: pkg.sale_starts_at ?? null,
        sale_ends_at: pkg.sale_ends_at ?? null,
        sale_active: pricing.saleActive,
      };
    });

    return new Response(JSON.stringify({ success: true, data }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'System error' }), { status: 500 });
  }
};
