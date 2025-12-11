// src/pages/api/tarot-validate.js
export const prerender = false;

export async function POST({ request }) {
  console.log('🔵 API tarot-validate được gọi');
  
  try {
    const body = await request.json();
    console.log('📥 Request body:', body);
    
    const webhookUrl = import.meta.env.N8N_VALIDATE_TAROT;
    console.log('🔗 Webhook URL exists:', !!webhookUrl);
    
    if (!webhookUrl) {
      return new Response(JSON.stringify({ 
        error: 'N8N_VALIDATE_TAROT environment variable not found' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`N8N returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ N8N response:', data);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in tarot-validate:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check Netlify function logs for more info'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}