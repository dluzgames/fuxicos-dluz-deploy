import { query } from '@/lib/db';
import Link from 'next/link';
import DeleteForm from './DeleteForm';

export const metadata = {
  title: 'Painel Admin | Fuxi Dluz',
};

export default async function AdminDashboard() {
  const result = await query('SELECT id, title, slug, status, created_at FROM articles ORDER BY created_at DESC');
  const articles = result.rows;

  return (
    <div className="admin-full-container">
      <div className="admin-header-flex">
        <h2>Pautas & Notícias</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin/nova-noticia" className="btn">Nova Notícia</Link>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Status</th>
            <th>Slug</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td>{article.id}</td>
              <td style={{ fontWeight: 600 }}>{article.title}</td>
              <td>
                <span className={`badge ${article.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                  {article.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </td>
              <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{article.slug}</td>
              <td style={{ fontSize: '0.9rem' }}>{new Date(article.created_at).toLocaleDateString('pt-BR')}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Link href={`/noticia/${article.slug}`} target="_blank" style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Ver
                  </Link>
                  <span style={{ color: 'var(--border-color)' }}>|</span>
                  <Link href={`/admin/editar/${article.id}`} style={{ color: '#0369a1', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    Editar
                  </Link>
                  <span style={{ color: 'var(--border-color)' }}>|</span>
                  <DeleteForm id={article.id} />
                </div>
              </td>
            </tr>
          ))}
          {articles.length === 0 && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>Nenhuma notícia cadastrada.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
