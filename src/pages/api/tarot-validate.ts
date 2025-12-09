import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Lấy biến môi trường
    const webhookUrl = import.meta.env.N8N_TAROT_VALIDATE;
    const secret = import.meta.env.N8N_SECRET;

    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "Missing Env Var" }), { status: 500 });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Secret-Token': secret || '' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
       return new Response(JSON.stringify({ error: "N8N Error" }), { status: response.status });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });
    
  } catch (error) {
    // Trả về lỗi rõ ràng thay vì để Pending mãi
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}