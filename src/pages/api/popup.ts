import type { APIRoute } from 'astro';

export const prerender = false;

type PageRules = {
  mode?: 'all' | 'include' | 'exclude';
  paths?: string[];
};

type AudienceRules = {
  mode?: 'all' | 'logged_in' | 'guest';
  tier?: 'all' | 'no_purchase' | 'basic' | 'premium';
};

type UserPackageTier = 'no_purchase' | 'basic' | 'premium' | null;

type PopupRow = {
  id: string;
  name: string;
  enabled: number;
  title: string | null;
  body: string | null;
  image_url: string | null;
  template: string | null;
  cta_label: string | null;
  cta_url: string | null;
  display_delay_seconds: number | null;
  display_frequency: string | null;
  page_rules: string | null;
  audience_rules: string | null;
  starts_at: string | null;
  ends_at: string | null;
  priority: number | null;
};

async function ensureSitePopupTable(db: any) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS site_popups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      enabled INTEGER DEFAULT 0,
      title TEXT,
      body TEXT,
      image_url TEXT,
      template TEXT DEFAULT 'centered-card',
      cta_label TEXT,
      cta_url TEXT,
      display_delay_seconds INTEGER DEFAULT 5,
      display_frequency TEXT DEFAULT 'once_per_day',
      page_rules TEXT DEFAULT '{"mode":"all","paths":[]}',
      audience_rules TEXT DEFAULT '{"mode":"all"}',
      starts_at TEXT,
      ends_at TEXT,
      priority INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  try {
    await db.prepare("ALTER TABLE site_popups ADD COLUMN template TEXT DEFAULT 'centered-card'").run();
  } catch (error: any) {
    if (!String(error?.message || '').toLowerCase().includes('duplicate column')) {
      throw error;
    }
  }

  try {
    await db.prepare("ALTER TABLE site_popups ADD COLUMN audience_rules TEXT DEFAULT '{\"mode\":\"all\"}'").run();
  } catch (error: any) {
    if (!String(error?.message || '').toLowerCase().includes('duplicate column')) {
      throw error;
    }
  }
}

function parseRules(raw: string | null): PageRules {
  if (!raw) return { mode: 'all', paths: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      mode: parsed?.mode || 'all',
      paths: Array.isArray(parsed?.paths) ? parsed.paths : [],
    };
  } catch {
    return { mode: 'all', paths: [] };
  }
}

function parseAudienceRules(raw: string | null): AudienceRules {
  if (!raw) return { mode: 'all' };
  try {
    const parsed = JSON.parse(raw);
    return {
      mode: parsed?.mode || 'all',
      tier: parsed?.tier || 'all',
    };
  } catch {
    return { mode: 'all' };
  }
}

function normalizePath(path: string) {
  const clean = String(path || '/').split('?')[0].split('#')[0] || '/';
  return clean !== '/' ? clean.replace(/\/+$/, '') : '/';
}

function matchesPattern(path: string, pattern: string) {
  const normalizedPath = normalizePath(path);
  const normalizedPattern = normalizePath(pattern);
  if (normalizedPattern === normalizedPath) return true;
  if (normalizedPattern.endsWith('/*')) {
    const prefix = normalizedPattern.slice(0, -2);
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  }
  return false;
}

function matchesPageRules(path: string, rules: PageRules) {
  const mode = rules.mode || 'all';
  const paths = Array.isArray(rules.paths) ? rules.paths.filter(Boolean) : [];
  if (mode === 'all' || paths.length === 0) return mode !== 'include';

  const matched = paths.some((pattern) => matchesPattern(path, pattern));
  if (mode === 'include') return matched;
  if (mode === 'exclude') return !matched;
  return true;
}

function matchesAudienceRules(isLoggedIn: boolean, packageTier: UserPackageTier, rules: AudienceRules) {
  const mode = rules.mode || 'all';
  if (mode === 'logged_in' && !isLoggedIn) return false;
  if (mode === 'guest' && isLoggedIn) return false;
  const tier = rules.tier || 'all';
  if (tier !== 'all') return isLoggedIn && packageTier === tier;
  return true;
}

function isPremiumWallet(wallet: any) {
  if (!wallet || wallet.subscription_tier !== 'premium') return false;
  if (!wallet.subscription_expires_at) return true;
  const expiresAt = Date.parse(String(wallet.subscription_expires_at));
  return Number.isNaN(expiresAt) || expiresAt > Date.now();
}

async function getUserPackageTier(db: any, user: any): Promise<UserPackageTier> {
  if (!user?.id) return null;

  const wallet = await db.prepare(`
    SELECT subscription_tier, subscription_expires_at
    FROM credit_wallets
    WHERE user_id = ?
  `).bind(user.id).first();

  if (isPremiumWallet(wallet)) return 'premium';

  const paid = await db.prepare(`
    SELECT COUNT(*) AS total
    FROM payment_requests
    WHERE user_id = ? AND status = 'paid'
  `).bind(user.id).first();

  return Number(paid?.total || 0) > 0 ? 'basic' : 'no_purchase';
}

function toMillis(value: string | null) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function isInWindow(row: PopupRow, now = Date.now()) {
  const startsAt = toMillis(row.starts_at);
  const endsAt = toMillis(row.ends_at);
  return (startsAt === null || now >= startsAt) && (endsAt === null || now < endsAt);
}

export const GET: APIRoute = async (context) => {
  try {
    const env: any = context.locals.runtime?.env ?? {};
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, error: 'Database not configured' }), { status: 500 });
    }

    await ensureSitePopupTable(db);

    const requestUrl = new URL(context.request.url);
    const currentPath = normalizePath(requestUrl.searchParams.get('path') || '/');
    const isLoggedIn = !!context.locals.user;
    const packageTier = await getUserPackageTier(db, context.locals.user);
    const { results } = await db.prepare(`
      SELECT *
      FROM site_popups
      WHERE enabled = 1
      ORDER BY priority DESC, updated_at DESC
      LIMIT 20
    `).all<PopupRow>();

    const popup = (results || []).find((row) => {
      return (
        isInWindow(row) &&
        matchesPageRules(currentPath, parseRules(row.page_rules)) &&
        matchesAudienceRules(isLoggedIn, packageTier, parseAudienceRules(row.audience_rules))
      );
    });

    if (!popup) {
      return new Response(JSON.stringify({ success: true, data: null }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-store',
          'Vary': 'Cookie',
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: popup.id,
        name: popup.name,
        title: popup.title || '',
        body: popup.body || '',
        imageUrl: popup.image_url || '',
        template: popup.template || 'centered-card',
        ctaLabel: popup.cta_label || '',
        ctaUrl: popup.cta_url || '',
        delaySeconds: Number(popup.display_delay_seconds ?? 5),
        frequency: popup.display_frequency || 'once_per_day',
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
        'Vary': 'Cookie',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'System error' }), { status: 500 });
  }
};
