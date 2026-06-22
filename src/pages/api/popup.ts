import type { APIRoute } from 'astro';

export const prerender = false;

type PageRules = {
  mode?: 'all' | 'include' | 'exclude';
  paths?: string[];
};

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
    const { results } = await db.prepare(`
      SELECT *
      FROM site_popups
      WHERE enabled = 1
      ORDER BY priority DESC, updated_at DESC
      LIMIT 20
    `).all<PopupRow>();

    const popup = (results || []).find((row) => {
      return isInWindow(row) && matchesPageRules(currentPath, parseRules(row.page_rules));
    });

    if (!popup) {
      return new Response(JSON.stringify({ success: true, data: null }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
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
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'System error' }), { status: 500 });
  }
};
