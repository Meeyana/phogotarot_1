import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log('🔵 tarot-interpret API route called');
  try {
    const body = await request.json();
    const webhookUrl = import.meta.env.N8N_WEBHOOK_TAROT || process.env.N8N_WEBHOOK_TAROT;
    
    if (!webhookUrl) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
