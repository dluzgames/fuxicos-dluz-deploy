'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveArticle(data) {
  const { 
    title, 
    slug, 
    excerpt, 
    content, 
    seo_title, 
    seo_description, 
    source_name, 
    source_link, 
    image_url, 
    image_credit, 
    category, 
    status 
  } = data;
  
  if (!title || !slug || !content) {
    return { success: false, error: 'Título, slug e conteúdo são obrigatórios.' };
  }

  try {
    const result = await query(
      `INSERT INTO articles (title, slug, excerpt, content, seo_title, seo_description, source_name, source_link, image_url, image_credit, category, status, ai_generated) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
       RETURNING id`,
      [
        title, 
        slug, 
        excerpt || '', 
        content, 
        seo_title || null, 
        seo_description || null, 
        source_name || null, 
        source_link || null, 
        image_url || null, 
        image_credit || null, 
        category || 'Famosos', 
        status || 'draft'
      ]
    );
    
    return { success: true, articleId: result.rows[0]?.id };
  } catch (err) {
    console.error('Erro ao salvar artigo gerado por IA:', err);
    return { success: false, error: 'Erro ao salvar: ' + err.message };
  }
}

export async function deleteArticle(id) {
  try {
    await query('DELETE FROM articles WHERE id = $1', [id]);
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('Erro ao deletar notícia:', err);
    return { success: false, error: 'Erro ao deletar: ' + err.message };
  }
}
