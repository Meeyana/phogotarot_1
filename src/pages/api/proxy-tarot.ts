// src/pages/api/proxy-tarot.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Lấy dữ liệu từ Frontend gửi lên
    const body = await request.json();

    // 2. Lấy URL và Secret từ biến môi trường (Netlify quản lý cái này)
    const n8nUrl = import.meta.env.N8N_WEBHOOK_URL;
    const n8nSecret = import.meta.env.N8N_SECRET_TOKEN;

    if (!n8nUrl) {
      return new Response(JSON.stringify({ error: "Chưa cấu hình Server" }), { status: 500 });
    }

    // 3. Gọi n8n từ phía Server (Netlify) -> n8n
    // Hacker không thể thấy đoạn này vì nó chạy trên server của Netlify
    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Token': n8nSecret || '', // Gửi kèm mật khẩu để n8n nhận diện
      },
      body: JSON.stringify(body),
    });

    // 4. Trả kết quả về cho Frontend
    const data = await n8nResponse.json();
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Lỗi kết nối" }), { status: 500 });
  }
};