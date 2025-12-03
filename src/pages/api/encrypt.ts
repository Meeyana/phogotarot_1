// src/pages/api/encrypt.ts
import type { APIRoute } from 'astro';
import { encryptData } from '../../utils/encryption';

export const prerender = false; // QUAN TRỌNG: Phải là server-side

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Lấy dữ liệu từ request
    const body = await request.json();
    const { name, dob, nickname, gender } = body;

    // 2. Validate
    if (!name || !dob) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Mã hóa dữ liệu
    const token = encryptData({
      name,
      dob,
      nickname: nickname || '',
      gender: gender || 'male'
    });

    // 4. Trả về token
    return new Response(
      JSON.stringify({ token }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Encryption API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};