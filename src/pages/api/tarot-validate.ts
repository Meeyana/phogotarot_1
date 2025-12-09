import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const webhookUrl = import.meta.env.N8N_TAROT_VALIDATE;
  const secret = import.meta.env.N8N_SECRET;

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Secret-Token': secret },
    body: JSON.stringify(body)
  });
  return new Response(JSON.stringify(await response.json()), { status: 200 });
}