import type { APIRoute } from 'astro';

// Lấy trước URL public của tất cả ảnh trong thư mục cards
const cardImages = import.meta.glob('/src/assets/uploads/cards/*.jpg', { query: '?url', import: 'default', eager: true });

export const GET: APIRoute = async (context) => {
    try {
        const env: any = context.locals.runtime?.env || process.env || import.meta.env;
        const db = env.DB;
        
        if (!db) {
            return new Response(JSON.stringify({ error: 'Database not configured' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Truy vấn danh sách 78 lá bài từ bảng tarot_database đã có
        const { results } = await db.prepare('SELECT id, card_name FROM tarot_database ORDER BY id ASC').all();

        if (!results || results.length === 0) {
            return new Response(JSON.stringify({ error: 'No cards found in database' }), { status: 404 });
        }

        // Kết hợp tên bài từ DB với URL ảnh tương ứng
        const cards = results.map((row: any) => {
            // Tên file ảnh có định dạng "{id}-Tên-Bài.jpg", ví dụ "0-The-Fool.jpg"
            const imagePath = Object.keys(cardImages).find(path => {
                const filename = path.split('/').pop() || '';
                return filename.startsWith(`${row.id}-`);
            });

            return {
                id: row.id,
                name: row.card_name,
                image: imagePath ? cardImages[imagePath] : 'https://placehold.co/200x340'
            };
        });

        return new Response(JSON.stringify(cards), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error("Lỗi API /api/tarot-cards:", err);
        return new Response(JSON.stringify({ error: err.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
