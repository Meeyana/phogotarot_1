import type { APIRoute } from 'astro';

// Hàm này dành cho trình duyệt test (GET)
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ message: "GET success" }), {
    status: 200,
    headers: { "Content-Type": "application/json" } // Quan trọng để hiển thị JSON đẹp
  });
}

// Hàm này dành cho Form gửi lên (POST)
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  return new Response(JSON.stringify({ message: "POST success", received: body }), {
    status: 200 
  });
}