import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Thử đọc biến bằng cả 2 cách
  const secret = import.meta.env.N8N_SECRET || process.env.N8N_SECRET;
  
  // Lấy thêm 1 biến mặc định của Netlify để test xem server có sống không
  const siteName = import.meta.env.SITE_NAME || process.env.SITE_NAME || "Không đọc được SITE_NAME";

  console.log("Server Log: Đang xử lý request test-env");

  if (!secret) {
    return new Response(JSON.stringify({
      success: false,
      error: "MISSING_SECRET",
      message: "Không tìm thấy biến N8N_SECRET. Hãy kiểm tra lại Netlify UI.",
      debug_site_name: siteName // Trả về cái này để xem server có đọc được biến nào không
    }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Đã đọc được Secret!",
    // Chỉ hiện 3 ký tự đầu + 3 ký tự cuối để verify
    token_preview: `${secret.substring(0, 3)}...${secret.substring(secret.length - 3)}`,
    token_length: secret.length
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}