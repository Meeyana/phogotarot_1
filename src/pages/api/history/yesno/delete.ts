import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
    if (!locals.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
        }

        const db = locals.runtime?.env?.DB;
        if (!db) {
            return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500 });
        }

        // Kiểm tra xem bài có thuộc về user không
        const reading = await db.prepare('SELECT id FROM yes_no_readings WHERE id = ? AND user_id = ?').bind(id, locals.user.id).first();
        if (!reading) {
            return new Response(JSON.stringify({ error: 'Not found or forbidden' }), { status: 404 });
        }

        // Xóa khỏi DB
        await db.prepare('DELETE FROM yes_no_readings WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Delete yes/no history error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
