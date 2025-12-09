import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log("👉 [1] Đã nhận Request từ Frontend");

  try {
    // 1. Lấy dữ liệu
    const body = await request.json();
    console.log("👉 [2] Body:", body);

    // 2. Kiểm tra Env
    const webhookUrl = "https://n8n.n8ntuanphangz.xyz/webhook/fe3c376f-62f2-472d-ac01-d39ba5496e75";;
    const secret = "Bi_Mat_Nay_Chi_Minh_Toi_Biet_2024";
    console.log("👉 URL đang dùng:", webhookUrl);
    
    console.log("👉 [3] URL n8n:", webhookUrl || "❌ BỊ THIẾU (UNDEFINED)");

    if (!webhookUrl) {
      console.error("❌ LỖI: Thiếu biến môi trường N8N_TAROT_VALIDATE");
      // Phải trả về Response thì mới hết treo
      return new Response(JSON.stringify({ error: "Server Config Error" }), { status: 500 });
    }

    // 3. Gọi n8n (Thêm timeout để không bị treo vĩnh viễn)
    console.log("👉 [4] Đang gửi sang n8n...");
    
    // Tạo bộ đếm giờ, nếu quá 10s n8n không trả lời thì tự ngắt
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Secret-Token': secret || ''
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // Xóa bộ đếm giờ nếu thành công

    console.log("👉 [5] n8n đã phản hồi. Status:", response.status);

    if (!response.ok) {
       const textErr = await response.text();
       console.error("❌ n8n trả về lỗi:", textErr);
       return new Response(JSON.stringify({ error: "N8N Error", detail: textErr }), { status: response.status });
    }

    const data = await response.json();
    console.log("👉 [6] Thành công! Data:", data);
    
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error: any) {
    console.error("❌ LỖI FATAL:", error);
    
    // Xử lý lỗi Timeout
    if (error.name === 'AbortError') {
        return new Response(JSON.stringify({ error: "N8N Timeout (Quá 10s không phản hồi)" }), { status: 504 });
    }

    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}