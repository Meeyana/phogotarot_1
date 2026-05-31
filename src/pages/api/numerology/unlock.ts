import type { APIRoute } from 'astro';
import { getDB } from '../../../db';
import { validateSession } from '../../../lib/auth';
import { creditWallets, unlockedNumerologyProfiles, creditTransactions } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
  const { request, cookies, locals } = context;
  try {
    const rawDB = locals.runtime?.env?.DB || process.env.DB;
    const db = getDB(context);
    const sessionId = cookies.get('phogo_session')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Bạn cần đăng nhập để thực hiện chức năng này.' }), { status: 401 });
    }

    const { user } = await validateSession(rawDB, sessionId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Phiên đăng nhập không hợp lệ.' }), { status: 401 });
    }

    const body = await request.json();
    const { fullName, dobStr, nickname = '', gender = '' } = body;

    if (!fullName || !dobStr) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin hồ sơ.' }), { status: 400 });
    }

    const profileId = `${fullName.toLowerCase().trim()}|${dobStr}|${nickname.toLowerCase().trim()}|${gender.toLowerCase().trim()}`;

    // Đảm bảo bảng tồn tại
    try {
        await rawDB.prepare(`CREATE TABLE IF NOT EXISTS unlocked_numerology_profiles (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, profile_id TEXT NOT NULL, nickname TEXT, gender TEXT, unlocked_at INTEGER DEFAULT CURRENT_TIMESTAMP)`).run();
        try { await rawDB.prepare(`ALTER TABLE unlocked_numerology_profiles ADD COLUMN nickname TEXT`).run(); } catch(e){}
        try { await rawDB.prepare(`ALTER TABLE unlocked_numerology_profiles ADD COLUMN gender TEXT`).run(); } catch(e){}
    } catch (e) {
        console.error('Lỗi khi tạo/cập nhật bảng trong API:', e);
    }

    // Kiểm tra xem đã mở khóa chưa
    const existing = await db.select().from(unlockedNumerologyProfiles)
      .where(eq(unlockedNumerologyProfiles.userId, user.id));
    
    const isUnlocked = existing.some(p => p.profileId === profileId);
    if (isUnlocked || (user.premiumUntil && user.premiumUntil.getTime() > Date.now())) {
      return new Response(JSON.stringify({ success: true, message: 'Hồ sơ đã được mở khóa sẵn.' }), { status: 200 });
    }

    // Lấy ví credit
    const walletResults = await db.select().from(creditWallets).where(eq(creditWallets.userId, user.id)).limit(1);
    const wallet = walletResults[0];
    
    const totalCredits = (wallet?.balance || 0) + (wallet?.dailyCredits || 0);
    
    if (!wallet || totalCredits < 3) {
      return new Response(JSON.stringify({ error: 'Không đủ 3 Credit. Vui lòng nạp thêm.' }), { status: 403 });
    }

    // Tính toán trừ tiền: ưu tiên trừ daily_credits trước
    let remainingToDeduct = 3;
    let deductDaily = 0;
    let deductBalance = 0;

    if (wallet.dailyCredits > 0) {
        if (wallet.dailyCredits >= remainingToDeduct) {
            deductDaily = remainingToDeduct;
            remainingToDeduct = 0;
        } else {
            deductDaily = wallet.dailyCredits;
            remainingToDeduct -= wallet.dailyCredits;
        }
    }
    deductBalance = remainingToDeduct;

    // 1. Trừ tiền
    await rawDB.prepare('UPDATE credit_wallets SET daily_credits = daily_credits - ?, balance = balance - ? WHERE user_id = ?')
      .bind(deductDaily, deductBalance, user.id)
      .run();

    // 2. Lưu giao dịch
    await rawDB.prepare('INSERT INTO credit_transactions (id, wallet_id, amount, transaction_type, description) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), user.id, -3, 'UNLOCK_NUMEROLOGY', `Mở khóa hồ sơ thần số học: ${fullName} - ${dobStr}`)
      .run();

    // 3. Lưu hồ sơ đã mở
    await rawDB.prepare('INSERT INTO unlocked_numerology_profiles (id, user_id, profile_id, nickname, gender) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), user.id, profileId, nickname, gender)
      .run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Lỗi khi mở khóa hồ sơ:', error);
    return new Response(JSON.stringify({ error: 'Đã xảy ra lỗi hệ thống.' }), { status: 500 });
  }
};
