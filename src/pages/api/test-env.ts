// src/pages/api/test-env.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Trong chế độ 'server', import.meta.env hoạt động trên Server (an toàn)
  // Lưu ý: Netlify Secrets đôi khi cần dùng process.env, ta sẽ thử cả 2 để chắc chắn
  const secret = import.meta.env.N8N_SECRET || process.env.N8N_SECRET;

  console.log("Đang kiểm tra Secret...");

  if (!secret) {
    return new Response(JSON.stringify({
      success: false,
      message: "LỖI: Không đọc được N8N_SECRET"
    }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Thành công! API (SSR) đã đọc được biến môi trường.",
    // Chỉ in 5 ký tự đầu để chứng minh
    preview: secret.substring(0, 5) + '...' 
  }), { 
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}