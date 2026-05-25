import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const db = locals.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "Database not connected" }), { status: 500 });
  }

  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing conversation ID" }), { status: 400 });
    }

    // Verify ownership
    const conv = await db.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(id, locals.user.id).first();
    if (!conv) {
      return new Response(JSON.stringify({ error: "Conversation not found or access denied" }), { status: 404 });
    }

    // Delete associated records first (if no CASCADE is setup)
    await db.prepare('DELETE FROM message_logs WHERE conversation_id = ?').bind(id).run();
    await db.prepare('DELETE FROM tarot_readings WHERE conversation_id = ?').bind(id).run();
    
    // Delete the conversation
    await db.prepare('DELETE FROM conversations WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Lỗi xóa hội thoại:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
