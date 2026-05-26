import type { APIRoute } from 'astro';

// Lấy trước URL public của tất cả ảnh trong thư mục cards
const cardImages = import.meta.glob('/src/assets/uploads/cards/*.jpg', { query: '?url', import: 'default', eager: true });

export const GET: APIRoute = async (context) => {
    try {
        const env: any = context.locals.runtime?.env || process.env || import.meta.env;
        const db = env.DB;
        
        let cards = [];
        let dbSuccess = false;
        
        if (db) {
            try {
                // Truy vấn danh sách 78 lá bài từ bảng tarot_database đã có
                const { results } = await db.prepare('SELECT id, card_name FROM tarot_database ORDER BY id ASC').all();

                if (results && results.length > 0) {
                    // Kết hợp tên bài từ DB với URL ảnh tương ứng
                    cards = results.map((row: any) => {
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
                    dbSuccess = true;
                }
            } catch (dbErr) {
                console.warn("⚠️ Database query failed (e.g. no such table or schema error). Falling back to static assets mapping:", dbErr);
            }
        }

        // Nếu database không khả dụng hoặc truy vấn thất bại, tự động chuyển sang fallback tĩnh
        if (!dbSuccess) {
            cards = Object.keys(cardImages).map(path => {
                const filename = path.split('/').pop() || '';
                const nameWithoutExt = filename.replace('.jpg', '');
                const parts = nameWithoutExt.split('-');
                const id = parseInt(parts[0]);
                const cardName = parts.slice(1).join(' ');
                
                return {
                    id: id,
                    name: cardName,
                    image: cardImages[path]
                };
            });
            cards.sort((a, b) => a.id - b.id);
        }

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


