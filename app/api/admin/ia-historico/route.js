import { query } from '@/lib/db';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

// Check admin authentication
async function isAuthenticated(request) {
  const session = request.cookies.get('admin_session')?.value;
  if (!session) return false;
  try {
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const secret = new TextEncoder().encode(adminPassword);
    await jwtVerify(session, secret);
    return true;
  } catch (error) {
    return false;
  }
}

export async function GET(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const res = await query(
      `SELECT g.*, f.name as feed_name, a.title as article_title, a.slug as article_slug
       FROM ai_generations g
       LEFT JOIN ai_feeds f ON g.feed_id = f.id
       LEFT JOIN articles a ON g.article_id = a.id
       ORDER BY g.created_at DESC
       LIMIT 100`
    );
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
