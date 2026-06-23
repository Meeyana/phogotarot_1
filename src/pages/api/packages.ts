import type { APIRoute } from 'astro';
import { getEffectivePackagePrice, type PackageRecord } from '../../lib/pricing';

export const prerender = false;

const PACKAGE_DISPLAY_NAMES: Record<string, string> = {
  'Khởi Đầu (3 lượt)': 'Gói 3 Credit',
  'Gói Khởi Đầu': 'Gói 3 Credit',
  'Đồng Hành (10 lượt)': 'Gói 10 Credit',
  'Gói Đồng Hành': 'Gói 10 Credit',
  'Vương Giả (Gói Tháng)': 'Gói Tháng',
  'Chuyên Gia (Gói Năm)': 'Gói Năm',
  'Khai Sáng (Trọn Đời)': 'Gói Trọn Đời',
};

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
               sale_ends_at, show_countdown, credits, type, is_active
        FROM packages
        WHERE is_active = 1
        ORDER BY created_at ASC
      `)
      .all<PackageRecord>();

    const data = (results || []).map((pkg) => {
      const pricing = getEffectivePackagePrice(pkg);
      return {
        id: pkg.id,
        name: PACKAGE_DISPLAY_NAMES[pkg.id] || PACKAGE_DISPLAY_NAMES[pkg.name] || pkg.name,
        type: pkg.type,
        credits: pkg.credits,
        is_active: pkg.is_active,
        price: pricing.effectivePrice,
        list_price: pricing.listPrice,
        sale_price: pkg.sale_price ?? null,
        sale_starts_at: pkg.sale_starts_at ?? null,
        sale_ends_at: pkg.sale_ends_at ?? null,
        show_countdown: pkg.show_countdown === 0 || pkg.show_countdown === false ? 0 : 1,
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
