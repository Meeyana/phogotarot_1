import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
    try {
        const body = await context.request.json();
        const env: any = context.locals.runtime?.env || process.env || import.meta.env;
        const db = env.DB;
        
        if (!db) {
            return new Response(JSON.stringify({ error: 'Database config missing' }), { status: 500 });
        }

        // Đơn giản hóa bảo mật cho API nội bộ cập nhật data (dùng secret key)
        const secret = context.request.headers.get('x-admin-secret');
        if (secret !== 'meeyana-tarot-2024') {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        if (!body.cards || !Array.isArray(body.cards)) {
            return new Response(JSON.stringify({ error: 'Invalid payload, expected { cards: [...] }' }), { status: 400 });
        }

        const cards = body.cards;
        const stmts = cards.map((card: any) => {
            return db.prepare(`
                UPDATE tarot_database SET 
                    upright_meaning = ?, reversed_meaning = ?, yes_no_meaning = ?, image_description = ?,
                    upright_keyword = ?, reversed_keyword = ?, 
                    upright_love_keyword = ?, upright_career_keyword = ?, upright_finances_keyword = ?, 
                    reversed_love_keyword = ?, reversed_career_keyword = ?, reversed_finances_keyword = ?,
                    upright_love_meaning = ?, upright_career_meaning = ?, upright_finances_meaning = ?,
                    reversed_love_meaning = ?, reversed_career_meaning = ?, reversed_finances_meaning = ?
                WHERE card_name = ?
            `).bind(
                card.upright_meaning || '', card.reversed_meaning || '', card.yes_no_meaning || '', card.image_description || '',
                card.upright_keyword || '', card.reversed_keyword || '', 
                card.upright_love_keyword || '', card.upright_career_keyword || '', card.upright_finances_keyword || '', 
                card.reversed_love_keyword || '', card.reversed_career_keyword || '', card.reversed_finances_keyword || '',
                card.upright_love_meaning || '', card.upright_career_meaning || '', card.upright_finances_meaning || '',
                card.reversed_love_meaning || '', card.reversed_career_meaning || '', card.reversed_finances_meaning || '',
                card.card_name
            );
        });

        // Batch update để tối ưu performance trên D1
        const results = await db.batch(stmts);

        return new Response(JSON.stringify({ success: true, updated: cards.length }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error("Lỗi bulk update:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
