import { query } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Editar Notícia | Fuxi Dluz Admin',
};

async function updateNews(formData) {
  'use server';
  
  const id = formData.get('id');
  const title = formData.get('title');
  const slug = formData.get('slug');
  const category = formData.get('category');
  const excerpt = formData.get('excerpt');
  const content = formData.get('content');
  const seo_title = formData.get('seo_title');
  const seo_description = formData.get('seo_description');
  const source_name = formData.get('source_name');
  const source_link = formData.get('source_link');
  const image_url = formData.get('image_url');
  const image_credit = formData.get('image_credit');
  const status = formData.get('status');

  try {
    await query(
      `UPDATE articles 
       SET title = $1, slug = $2, excerpt = $3, content = $4, seo_title = $5, 
           seo_description = $6, source_name = $7, source_link = $8, image_url = $9, 
           image_credit = $10, category = $11, status = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13`,
      [title, slug, excerpt, content, seo_title, seo_description, source_name, source_link, image_url, image_credit, category, status, id]
    );
  } catch (err) {
    console.error(err);
    redirect(`/admin/editar/${id}?error=1`);
  }

  redirect('/admin');
}

export default async function EditarNoticia({ params, searchParams }) {
  const { id } = await params;
  const error = searchParams?.error;

  const result = await query('SELECT * FROM articles WHERE id = $1', [id]);
  const article = result.rows[0];

  if (!article) {
    notFound();
  }

  return (
    <div className="admin-full-container">
      <div className="admin-header-flex">
        <h2>Editar Notícia #{article.id}</h2>
        <Link href="/admin" className="btn btn-outline">Voltar</Link>
      </div>

      {error && (
        <div className="alert alert-error">
          Erro ao atualizar notícia. Verifique se o slug já existe ou se todos os campos obrigatórios foram preenchidos.
        </div>
      )}

      <form action={updateNews}>
        <input type="hidden" name="id" value={article.id} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label htmlFor="title">Título da Notícia *</label>
            <input type="text" id="title" name="title" className="form-control" defaultValue={article.title} required />
          </div>

          <div className="form-group">
            <label htmlFor="slug">Slug (URL) *</label>
            <input type="text" id="slug" name="slug" className="form-control" defaultValue={article.slug} required pattern="^[a-z0-9-]+$" title="Apenas letras minúsculas, números e hífens" />
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoria</label>
            <input type="text" id="category" name="category" className="form-control" defaultValue={article.category || 'Famosos'} />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status da Publicação</label>
            <select id="status" name="status" className="form-control" defaultValue={article.status || 'draft'}>
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image_url">URL da Imagem</label>
            <input type="url" id="image_url" name="image_url" className="form-control" defaultValue={article.image_url || ''} />
          </div>

          <div className="form-group">
            <label htmlFor="image_credit">Crédito da Imagem</label>
            <input type="text" id="image_credit" name="image_credit" className="form-control" defaultValue={article.image_credit || ''} />
          </div>

          <div className="form-group">
            <label htmlFor="source_name">Nome da Fonte Original</label>
            <input type="text" id="source_name" name="source_name" className="form-control" defaultValue={article.source_name || ''} />
          </div>

          <div className="form-group">
            <label htmlFor="source_link">Link da Fonte Original</label>
            <input type="url" id="source_link" name="source_link" className="form-control" defaultValue={article.source_link || ''} />
          </div>

          <div className="form-group">
            <label htmlFor="seo_title">Título SEO (Opcional)</label>
            <input type="text" id="seo_title" name="seo_title" className="form-control" defaultValue={article.seo_title || ''} />
          </div>

        </div>

        <div className="form-group">
          <label htmlFor="seo_description">Descrição SEO (Meta Description)</label>
          <input type="text" id="seo_description" name="seo_description" className="form-control" defaultValue={article.seo_description || ''} />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Resumo (Exibido na Home) *</label>
          <textarea id="excerpt" name="excerpt" className="form-control" style={{ minHeight: '80px' }} defaultValue={article.excerpt} required></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="content">Conteúdo HTML *</label>
          <textarea id="content" name="content" className="form-control" style={{ minHeight: '250px' }} defaultValue={article.content} required></textarea>
        </div>

        <button type="submit" className="btn">Salvar Alterações</button>
      </form>
    </div>
  );
}
