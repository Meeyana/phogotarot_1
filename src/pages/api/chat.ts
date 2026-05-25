import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const webhookUrl = env.N8N_WEBHOOK_CHAT;
    
    if (!webhookUrl) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // === LƯU VÀO D1 DATABASE ===
    if (data && data.output && env.DB) {
      try {
        const db = env.DB;
        const { sessionId, userId, chatInput } = body;
        const safeUserId = userId || 'anonymous';
        const safeSessionId = sessionId || crypto.randomUUID();
        
        // 1. Lưu User (nếu chưa tồn tại)
        await db.prepare(`INSERT OR IGNORE INTO users (id, role) VALUES (?, 'user')`).bind(safeUserId).run();
        
        // 2. Lưu Conversation
        const title = chatInput ? (chatInput.length > 50 ? chatInput.substring(0, 50) + '...' : chatInput) : 'Oracle Chat';
        await db.prepare(`INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)`).bind(safeSessionId, safeUserId, title).run();
        
        // 3. Lưu Message Logs (User & Assistant)
        if (chatInput) {
           await db.prepare(`INSERT INTO message_logs (conversation_id, role, content) VALUES (?, 'user', ?)`).bind(safeSessionId, chatInput).run();
        }
        await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model) VALUES (?, 'assistant', ?, 'oracle_agent')`).bind(safeSessionId, data.output).run();
        
      } catch (dbError) {
        console.error("Lỗi lưu D1 (chat):", dbError);
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
