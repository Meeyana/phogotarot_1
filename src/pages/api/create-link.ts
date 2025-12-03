// src/pages/api/create-link.ts
export const prerender = false;
import type { APIRoute } from 'astro';
import { encryptData } from '../../utils/crypto';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, dob, nickname, gender } = body;

    if (!name || !dob) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin' }), { status: 400 });
    }

    // Mã hóa dữ liệu
    const encryptedId = encryptData({ name, dob, nickname, gender });

    // Trả về URL an toàn
    return new Response(JSON.stringify({ 
      url: `/ket-qua-than-so-hoc?id=${encryptedId}` 
    }), { status: 200 });

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server Error' }), { status: 500 });
  }
};