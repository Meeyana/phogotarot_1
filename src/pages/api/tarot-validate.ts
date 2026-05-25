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
            
            // Nếu là follow-up và câu hỏi hợp lệ, KHÔNG ghi D1 ở đây vì tarot-interpret.ts sẽ ghi nhận đầy đủ sau đó.
            if (isFollowUp && isValid) {
                // Bỏ qua ghi D1 ở validate step này
            } else {
                // 1. Đảm bảo Conversation tồn tại
                const title = question.length > 50 ? question.substring(0, 50) + '...' : question;
                await db.prepare(`INSERT OR IGNORE INTO conversations (id, user_id, title) VALUES (?, ?, ?)`).bind(safeReadingId, safeUserId, "Trò chuyện: " + title).run();
                
                // 2. Lưu tin nhắn User
                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content) VALUES (?, 'user', ?)`).bind(safeReadingId, question).run();
                
                // 3. Lưu tin nhắn Bot (dựa vào data trả về, ví dụ lấy reason hoặc câu thoại mặc định nếu isValid = true)
                // Nếu isValid = true và pick_card = true, UI thường tự render câu hỏi "Bạn có đồng ý rút bài không", nên có thể không lưu hoặc lưu cứng.
                // Để đồng bộ với những gì UI hiển thị, ta sẽ lưu lại thông điệp tương ứng:
                let botReply = data.reason || "Vui lòng đặt câu hỏi cụ thể hơn.";
                if (isValid && (data.pick_card !== false && data.pick_card !== "false")) {
                     botReply = "Để giải đáp câu hỏi này, bạn cần thực hiện một lượt Trải bài Tarot. Bạn có đồng ý bắt đầu lượt trải bài này để bốc bài không?";
                }
                await db.prepare(`INSERT INTO message_logs (conversation_id, role, content, model) VALUES (?, 'assistant', ?, 'n8n_validate_agent')`).bind(safeReadingId, botReply).run();
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
