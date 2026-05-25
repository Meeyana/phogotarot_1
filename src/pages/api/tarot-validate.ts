import type { APIRoute } from 'astro';
export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const webhookUrl = env.N8N_VALIDATE_TAROT;
    
    if (!webhookUrl) return new Response(JSON.stringify({ error: 'Config missing' }), { status: 500 });
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // === LƯU VÀO D1 DATABASE ===
    if (data && env.DB) {
      try {
        const db = env.DB;
        const { question, readingId, isFollowUp } = body;
        
        // Lấy userId từ Middleware thay vì từ body để bảo mật
        const user = context.locals.user;
        if (user && question) {
            const safeUserId = user.id;
            const safeReadingId = readingId || crypto.randomUUID();
            const isValid = data.isValid === "true" || data.isValid === true;
            const pickCard = data.pick_card === "true" || data.pick_card === true;
            
            // CHỈ LƯU VÀO DB NẾU:
            // 1. Câu hỏi không hợp lệ (isValid = false) -> Bị từ chối
            // 2. Câu hỏi trò chuyện thông thường (isValid = true, pick_card = false) -> LLM trả lời trực tiếp
            // NẾU CÂU HỎI LÀ BỐC BÀI (isValid = true, pick_card = true) -> KHÔNG LƯU Ở ĐÂY!
            // Sẽ được lưu ở tarot-interpret.ts khi user ấn "Đồng ý" bốc bài.
            if (!isValid || !pickCard) {
                // 1. Đảm bảo Conversation tồn tại
                const title = question.length > 50 ? question.substring(0, 50) + '...' : question;
                await db.prepare(`INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)`).bind(safeReadingId, safeUserId, "Trò chuyện: " + title).run();
                
                // 2. Lưu tin nhắn User
                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content) VALUES (?, 'user', ?)`).bind(safeReadingId, question).run();
                
                // 3. Lưu tin nhắn Bot
                let botReply = data.reason || "Vui lòng đặt câu hỏi cụ thể hơn.";
                
                const actualModel = data.model || 'n8n_validate_agent';
                const promptTokens = data.usage?.prompt_tokens || 0;
                const completionTokens = data.usage?.completion_tokens || 0;
                const totalTokens = data.usage?.total_tokens || 0;

                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model, prompt_tokens, completion_tokens, total_tokens) VALUES (?, 'assistant', ?, ?, ?, ?, ?)`).bind(safeReadingId, botReply, actualModel, promptTokens, completionTokens, totalTokens).run();
            }
        }
      } catch (dbError) {
        console.error("Lỗi lưu D1 (tarot-validate):", dbError);
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
