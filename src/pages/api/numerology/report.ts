import type { APIRoute } from 'astro';
import { hasUnlockedProfile } from '../../../lib/auth';
import { buildNumerologyReport, getNumerologyProfileId } from '../../../lib/numerology-report';
import { numerologyDefinitions } from '../../../data/numerology-definitions';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const user = locals.user;

  if (!user) {
    return json({ error: 'Ban can dang nhap de xuat PDF.' }, 401);
  }

  const fullName = url.searchParams.get('name') || '';
  const dobStr = url.searchParams.get('dob') || '';
  const nickname = url.searchParams.get('nickname') || '';
  const gender = url.searchParams.get('gender') || '';

  if (!fullName || !dobStr) {
    return json({ error: 'Thieu thong tin ho so.' }, 400);
  }

  const rawDB = locals.runtime?.env?.DB || process.env.DB;
  const isPremium = !!(user.premiumUntil && user.premiumUntil.getTime() > Date.now());
  let hasUnlocked = false;

  if (!isPremium && rawDB) {
    const profileId = getNumerologyProfileId({ fullName, dobStr, nickname, gender });
    const legacyProfileId = `${fullName.toLowerCase().trim()}|${dobStr}`;

    try {
      await rawDB.prepare(`CREATE TABLE IF NOT EXISTS unlocked_numerology_profiles (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, profile_id TEXT NOT NULL, unlocked_at INTEGER DEFAULT CURRENT_TIMESTAMP)`).run();
    } catch (error) {
      console.error('Khong the kiem tra bang mo khoa than so hoc:', error);
    }

    hasUnlocked = await hasUnlockedProfile(rawDB, user.id, profileId, legacyProfileId);
  }

  if (!isPremium && !hasUnlocked) {
    return json({ error: 'PDF chi kha dung sau khi ho so than so hoc da duoc mo khoa.' }, 403);
  }

  const report = await buildNumerologyReport({ fullName, dobStr, nickname, gender });

  return json({
    ...report,
    definitions: numerologyDefinitions
  });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  });
}
