import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const db = context.locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }

    const user = context.locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await context.request.json();
    const { 
      full_name, 
      nickname, 
      date_of_birth, 
      gender, 
      location, 
      occupation, 
      relationship_status, 
      recent_events 
    } = body;

    // Cập nhật thông tin profile
    await db.prepare(`
      UPDATE user_profiles 
      SET full_name = ?, nickname = ?, date_of_birth = ?, gender = ?, location = ?, occupation = ?, relationship_status = ?, recent_events = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(
      full_name || null,
      nickname || null,
      date_of_birth || null,
      gender || null,
      location || null,
      occupation || null,
      relationship_status || null,
      recent_events || null,
      user.id
    ).run();

    return new Response(JSON.stringify({ success: true, message: 'Cập nhật hồ sơ thành công' }), { status: 200 });

  } catch (error: any) {
    console.error('Lỗi cập nhật hồ sơ:', error);
    return new Response(JSON.stringify({ error: 'Lỗi Database: ' + (error.message || JSON.stringify(error)) }), { status: 500 });
  }
};
