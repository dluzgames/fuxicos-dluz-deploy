import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Nova Notícia | Fuxi Dluz Admin',
};

async function createNews(formData) {
  'use server';
  
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
  const status = formData.get('status') || 'published';

  try {
    await query(
      `INSERT INTO articles (title, slug, excerpt, content, seo_title, seo_description, source_name, source_link, image_url, image_credit, category, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [title, slug, excerpt, content, seo_title, seo_description, source_name, source_link, image_url, image_credit, category, status]
    );
  } catch (err) {
    console.error(err);
    // Minimal error handling (redirect with error)
    redirect('/admin/nova-noticia?error=1');
  }

  redirect('/admin');
}

export default function NovaNoticia({ searchParams }) {
  const error = searchParams?.error;

  return (
    <div className="admin-full-container">
      <div className="admin-header-flex">
        <h2>Criar Nova Notícia</h2>
        <Link href="/admin" className="btn btn-outline">Voltar</Link>
      </div>

      {error && (
        <div className="alert alert-error">
          Erro ao salvar notícia. Verifique se o slug já existe ou se todos os campos obrigatórios foram preenchidos.
        </div>
      )}

      <form action={createNews}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div className="form-group">
            <label htmlFor="title">Título da Notícia *</label>
            <input type="text" id="title" name="title" className="form-control" required />
          </div>

          <div className="form-group">
            <label htmlFor="slug">Slug (URL) *</label>
            <input type="text" id="slug" name="slug" className="form-control" required pattern="^[a-z0-9-]+$" title="Apenas letras minúsculas, números e hífens" />
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoria</label>
            <input type="text" id="category" name="category" className="form-control" defaultValue="Famosos" />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status da Publicação</label>
            <select id="status" name="status" className="form-control" defaultValue="published">
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="image_url">URL da Imagem</label>
            <input type="url" id="image_url" name="image_url" className="form-control" />
          </div>

          <div className="form-group">
            <label htmlFor="image_credit">Crédito da Imagem</label>
            <input type="text" id="image_credit" name="image_credit" className="form-control" />
          </div>

          <div className="form-group">
            <label htmlFor="source_name">Nome da Fonte Original</label>
            <input type="text" id="source_name" name="source_name" className="form-control" />
          </div>

          <div className="form-group">
            <label htmlFor="source_link">Link da Fonte Original</label>
            <input type="url" id="source_link" name="source_link" className="form-control" />
          </div>

          <div className="form-group">
            <label htmlFor="seo_title">Título SEO (Opcional)</label>
            <input type="text" id="seo_title" name="seo_title" className="form-control" />
          </div>

        </div>

        <div className="form-group">
          <label htmlFor="seo_description">Descrição SEO (Meta Description)</label>
          <input type="text" id="seo_description" name="seo_description" className="form-control" />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Resumo (Exibido na Home) *</label>
          <textarea id="excerpt" name="excerpt" className="form-control" style={{ minHeight: '80px' }} required></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="content">Conteúdo HTML *</label>
          <textarea id="content" name="content" className="form-control" style={{ minHeight: '250px' }} required></textarea>
        </div>

        <button type="submit" className="btn">Publicar Notícia</button>
      </form>
    </div>
  );
}
