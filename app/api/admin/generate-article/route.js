import { query } from '@/lib/db';
import { generateArticle } from '@/lib/ai';
import { scrapeArticleText } from '@/lib/feeds';
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

export async function POST(request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { theme, category, referenceUrl, focus, additionalNotes } = await request.json();

    if (!theme) {
      return NextResponse.json({ error: 'O tema da notícia é obrigatório.' }, { status: 400 });
    }

    let sourceText = '';
    if (referenceUrl) {
      try {
        sourceText = await scrapeArticleText(referenceUrl);
      } catch (err) {
        console.warn('Falha ao raspar a URL de referência:', err.message);
      }
    }

    const result = await generateArticle({
      theme,
      category: category || 'Famosos',
      referenceUrl: referenceUrl || '',
      focus: focus || 'jornalístico',
      additionalNotes: additionalNotes || '',
      sourceText: sourceText,
      triggerType: 'manual'
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na geração manual:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
