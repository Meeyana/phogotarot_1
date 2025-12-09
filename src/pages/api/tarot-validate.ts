import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log("--- BẮT ĐẦU GỌI API validate ---");
  
  try {
    // 1. Kiểm tra Body gửi lên
    const body = await request.json();
    console.log("1. Body nhận được:", body);

    // 2. Kiểm tra Biến môi trường
    const webhookUrl = import.meta.env.N8N_TAROT_VALIDATE;
    const secret = import.meta.env.N8N_SECRET;
    
    console.log("2. URL Webhook:", webhookUrl ? "Đã có" : "BỊ THIẾU (UNDEFINED)");
    
    if (!webhookUrl) {
      console.error("LỖI: Không tìm thấy URL Webhook trong biến môi trường!");
      return new Response(JSON.stringify({ error: "Server config missing URL" }), { status: 500 });
    }

    // 3. Bắt đầu gọi n8n
    console.log("3. Đang gọi sang n8n...");
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Secret-Token': secret || '' 
      },
      body: JSON.stringify(body)
    });

    console.log("4. N8n phản hồi status:", response.status);

    if (!response.ok) {
       const textErr = await response.text();
       console.error("5. N8n báo lỗi:", textErr);
       return new Response(JSON.stringify({ error: "N8N Error", detail: textErr }), { status: response.status });
    }

    const data = await response.json();
    console.log("6. Thành công! Dữ liệu trả về:", data);
    
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (error: any) {
    console.error("--- LỖI FATAL ---", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}