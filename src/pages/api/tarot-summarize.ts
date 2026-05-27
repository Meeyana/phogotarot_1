import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const env: any = context.locals.runtime?.env || process.env || import.meta.env;
    const webhookUrl = env.N8N_WEBHOOK_SUMMARIZE || '';
    
    // Nếu người dùng chưa cấu hình webhook tóm tắt, ta bỏ qua mượt mà
    if (!webhookUrl) {
        console.log('Skipping summarize: N8N_WEBHOOK_SUMMARIZE is missing or empty in env');
        return new Response(JSON.stringify({ message: 'Summarize webhook not configured, skipping.' }), { status: 200 });
    }
    
    const db = env.DB;
    if (!db) return new Response(JSON.stringify({ error: 'DB not found' }), { status: 500 });

    const readingId = body.readingId;
    if (!readingId) return new Response(JSON.stringify({ error: 'readingId missing' }), { status: 400 });

    const user = context.locals.user;
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const queryUserId = user.id;

    // Lấy `user_persona` (Chân dung cũ) và thông tin cơ bản
    let profile = { name: 'lữ khách', gender: 'bạn', user_persona: '' };
    const row = await env.DB.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(queryUserId).first();
    if (row) {
        profile.name = row.nickname || row.full_name || 'lữ khách';
        profile.gender = row.gender || 'bạn';
        
        let combinedPersona = [];
        let basicInfo = [];
        if (row.date_of_birth) basicInfo.push(`Sinh ngày: ${row.date_of_birth}`);
        if (row.location) basicInfo.push(`Nơi ở: ${row.location}`);
        if (row.occupation) basicInfo.push(`Nghề nghiệp: ${row.occupation}`);
        if (row.relationship_status) basicInfo.push(`Tình trạng quan hệ: ${row.relationship_status}`);
        
        if (basicInfo.length > 0) {
            combinedPersona.push(`- Thông tin cơ bản: ${basicInfo.join(', ')}`);
        }
        
        if (row.recent_events && row.recent_events.trim() !== '') {
            combinedPersona.push(`- Biến cố gần đây / Cần tư vấn: ${row.recent_events}`);
        }
        if (row.user_persona && row.user_persona.trim() !== '') {
            combinedPersona.push(`- Đánh giá năng lượng từ AI (Lịch sử): ${row.user_persona}`);
        }
        
        profile.user_persona = combinedPersona.join('\n');
    }

    // Lấy 10 tin nhắn gần nhất của phiên này để tóm tắt
    const logs = await db.prepare('SELECT role, content FROM (SELECT * FROM message_logs WHERE conversation_id = ? ORDER BY id DESC LIMIT 10) ORDER BY id ASC').bind(readingId).all();
    
    if (!logs || !logs.results || logs.results.length === 0) {
        return new Response(JSON.stringify({ message: 'No logs to summarize' }), { status: 200 });
    }

    // Gọi lên n8n webhook tóm tắt
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: queryUserId,
            readingId: readingId,
            currentPersona: profile.user_persona,
            userProfile: profile,
            history: logs.results
        })
    });

    if (response.ok) {
        const result = await response.json();
        let newPersona = '';
        if (result.summary || result.user_persona || result.persona) {
            newPersona = result.summary || result.user_persona || result.persona;
        } else if (Array.isArray(result) && result[0]?.choices?.[0]?.message?.content) {
            newPersona = result[0].choices[0].message.content;
        } else if (result.choices?.[0]?.message?.content) {
            newPersona = result.choices[0].message.content;
        }

        if (newPersona && typeof newPersona === 'string') {
            // Cập nhật lại vào DB
            await db.prepare('UPDATE user_profiles SET user_persona = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
                    .bind(newPersona, queryUserId).run();
            return new Response(JSON.stringify({ success: true, persona: newPersona }), { status: 200 });
        }
    }

    return new Response(JSON.stringify({ success: false, message: 'Failed to summarize via webhook' }), { status: 500 });
  } catch (error: any) {
    console.error("Lỗi API tarot-summarize:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
