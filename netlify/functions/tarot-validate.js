export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  console.log('🔵 tarot-validate function called');

  try {
    const body = JSON.parse(event.body);
    const webhookUrl = process.env.N8N_VALIDATE_TAROT;
    
    if (!webhookUrl) {
      console.error('❌ N8N_VALIDATE_TAROT not found');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server config error' }) };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('❌ Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};