import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  console.log('🔵 tarot-validate API route called');
  try {
    const body = await request.json();
    const webhookUrl = 'https://n8n.phogotarot.com/webhook-test/7179b8ca-c774-47a9-9ed4-6bf975344059';
    
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
