import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, clientAddress, cookies, locals }) => {
  try {
    // Parse the payload sent from our frontend
    const body = await request.json();
    const { eventName, eventData, eventID, eventURL } = body;

    // Extract critical Facebook parameters from the user's browser environment
    const fbp = cookies.get('_fbp')?.value;
    const fbc = cookies.get('_fbc')?.value;
    const userAgent = request.headers.get('user-agent') || '';
    // Cloudflare passes the real IP in the cf-connecting-ip header
    const clientIp = request.headers.get('cf-connecting-ip') || clientAddress || '';

    // Cố gắng đọc từ Astro locals (Cloudflare runtime) trước, nếu không có thì fallback về import.meta.env
    // @ts-ignore
    const env = locals?.runtime?.env || process?.env || import.meta.env || {};
    const pixelId = env.FB_PIXEL_ID || import.meta.env.FB_PIXEL_ID;
    const accessToken = env.FB_ACCESS_TOKEN || import.meta.env.FB_ACCESS_TOKEN;
    const testCode = env.FB_TEST_CODE || import.meta.env.FB_TEST_CODE;

    if (!pixelId || !accessToken) {
      console.error('Missing FB_PIXEL_ID or FB_ACCESS_TOKEN in environment variables.');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }

    // Build the exact payload required by Facebook Graph API
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventID, // Used for deduplication with the browser pixel
          event_source_url: eventURL,
          action_source: 'website',
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: userAgent,
            fbp: fbp,
            fbc: fbc
            // If we had email/phone, we would hash it (SHA256) and put it here
          },
          custom_data: eventData // Includes our action, package, amount, etc.
        }
      ]
    };

    // Nếu có mã test_event_code từ Cloudflare, thêm vào payload để hiện lên màn hình Test
    if (testCode) {
      payload.test_event_code = testCode;
    }

    // Send the data securely from our Server to Facebook's Server
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Facebook CAPI Error:', result);
      return new Response(JSON.stringify({ error: 'Facebook API rejected the event', details: result }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, event_id: eventID }), { status: 200 });

  } catch (error: any) {
    console.error('CAPI Internal Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message, stack: error.stack }), { status: 500 });
  }
};
