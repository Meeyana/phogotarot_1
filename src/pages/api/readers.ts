import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
    try {
        const env: any = context.locals.runtime?.env || process.env || import.meta.env;

        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const stmt = env.DB.prepare('SELECT id, name, description, avatar_url FROM tarot_readers WHERE is_active = TRUE ORDER BY created_at ASC');
        const { results } = await stmt.all();

        return new Response(JSON.stringify({
            success: true,
            data: results || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error("Lỗi lấy danh sách readers:", err);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
