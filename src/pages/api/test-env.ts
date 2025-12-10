import type { APIRoute } from 'astro';

// DÒNG NÀY QUAN TRỌNG: Ép buộc file này phải chạy trên Server (SSR)
export const prerender = false; 

export const GET: APIRoute = async () => {
  // Thử cả 2 cách đọc biến để chắc chắn
  const secret = process.env.N8N_SECRET || import.meta.env.N8N_SECRET;
  
  console.log("--> API test-env đã được gọi!"); // Log này sẽ hiện trong Netlify Function Logs

  if (!secret) {
    return new Response(JSON.stringify({
      success: false,
      message: "Lỗi: Không tìm thấy N8N_SECRET trên Server."
    }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Kết nối thành công! Server đã đọc được biến.",
    token_preview: `${secret.substring(0, 5)}...`
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}