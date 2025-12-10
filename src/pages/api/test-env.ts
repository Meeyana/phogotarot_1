import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Ưu tiên dùng process.env khi chạy trên Netlify Server
  const secret = process.env.N8N_SECRET || import.meta.env.N8N_SECRET;
  
  return new Response(JSON.stringify({
    message: "Kết nối thành công!",
    secret_preview: secret ? `${secret.substring(0, 5)}...` : "KHÔNG TÌM THẤY",
    check_source: "Astro SSR API"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}