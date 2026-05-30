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
    const { fullName, dobStr } = body;

    if (!fullName || !dobStr) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin hồ sơ.' }), { status: 400 });
    }

    const profileId = `${fullName.toLowerCase().trim()}|${dobStr}`;

    // Đảm bảo bảng tồn tại
    try {
        await rawDB.prepare(`CREATE TABLE IF NOT EXISTS unlocked_numerology_profiles (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, profile_id TEXT NOT NULL, unlocked_at INTEGER DEFAULT CURRENT_TIMESTAMP)`).run();
    } catch (e) {
        console.error('Lỗi khi tạo bảng trong API:', e);
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
    if (!wallet || wallet.balance < 3) {
      return new Response(JSON.stringify({ error: 'Không đủ 3 Credit. Vui lòng nạp thêm.' }), { status: 403 });
    }

    // Trừ 3 credit và lưu profile (Sử dụng db.batch cho Cloudflare D1 thay vì transaction)
    await db.batch([
      // Trừ tiền
      db.update(creditWallets)
        .set({ balance: wallet.balance - 3 })
        .where(eq(creditWallets.userId, user.id)),

      // Lưu giao dịch
      db.insert(creditTransactions).values({
        id: crypto.randomUUID(),
        walletId: user.id,
        amount: -3,
        transactionType: 'UNLOCK_NUMEROLOGY',
        description: `Mở khóa hồ sơ thần số học: ${fullName} - ${dobStr}`
      }),

      // Lưu hồ sơ đã mở
      db.insert(unlockedNumerologyProfiles).values({
        id: crypto.randomUUID(),
        userId: user.id,
        profileId: profileId
      })
    ]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Lỗi khi mở khóa hồ sơ:', error);
    return new Response(JSON.stringify({ error: 'Đã xảy ra lỗi hệ thống.' }), { status: 500 });
  }
};
