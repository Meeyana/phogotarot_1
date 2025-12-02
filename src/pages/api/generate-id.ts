// src/pages/api/generate-id.ts
export const prerender = false; // Bắt buộc: Chạy SSR mode
import type { APIRoute } from 'astro';
import { encryptData } from '../../utils/security';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!data.name || !data.dob) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin' }), { status: 400 });
    }

    // Mã hóa
    const encryptedId = encryptData(data);

    if (!encryptedId) {
       return new Response(JSON.stringify({ error: 'Lỗi hệ thống' }), { status: 500 });
    }

    return new Response(JSON.stringify({ id: encryptedId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid Request' }), { status: 400 });
  }
}