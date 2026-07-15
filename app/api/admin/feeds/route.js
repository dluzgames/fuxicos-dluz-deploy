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

// GET all feeds
export async function GET(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const res = await query('SELECT * FROM ai_feeds ORDER BY created_at DESC');
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create feed
export async function POST(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { 
      name, 
      url, 
      category, 
      schedule_hours, 
      timezone, 
      max_items_per_run, 
      mode, 
      image_policy,
      is_active,
      allowed_keywords,
      blocked_keywords
    } = await request.json();

    if (!name || !url) {
      return NextResponse.json({ error: 'Nome e URL são obrigatórios.' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO ai_feeds 
       (name, url, category, schedule_hours, timezone, max_items_per_run, mode, image_policy, is_active, allowed_keywords, blocked_keywords) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        name, 
        url, 
        category || 'Famosos', 
        schedule_hours || '08:00, 12:00, 18:00', 
        timezone || 'America/Araguaina', 
        parseInt(max_items_per_run || '3', 10), 
        mode || 'draft', 
        image_policy || 'attach',
        is_active !== false,
        allowed_keywords || null,
        blocked_keywords || null
      ]
    );

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update feed
export async function PUT(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { 
      id,
      name, 
      url, 
      category, 
      schedule_hours, 
      timezone, 
      max_items_per_run, 
      mode, 
      image_policy,
      is_active,
      allowed_keywords,
      blocked_keywords
    } = await request.json();

    if (!id || !name || !url) {
      return NextResponse.json({ error: 'ID, Nome e URL são obrigatórios.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE ai_feeds 
       SET name = $1, url = $2, category = $3, schedule_hours = $4, timezone = $5, 
           max_items_per_run = $6, mode = $7, image_policy = $8, is_active = $9, 
           allowed_keywords = $10, blocked_keywords = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [
        name, 
        url, 
        category, 
        schedule_hours, 
        timezone, 
        parseInt(max_items_per_run, 10), 
        mode, 
        image_policy, 
        is_active,
        allowed_keywords || null,
        blocked_keywords || null,
        id
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Feed não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE feed
export async function DELETE(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
    }

    await query('DELETE FROM ai_feeds WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
