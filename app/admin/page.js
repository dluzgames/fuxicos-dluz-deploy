import { query } from '@/lib/db';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Painel Admin | Fuxi Dluz',
};

// Logout action
async function logout() {
  'use server';
  cookies().delete('admin_session');
  redirect('/admin/login');
}

export default async function AdminDashboard() {
  const result = await query('SELECT id, title, slug, created_at FROM articles ORDER BY created_at DESC');
  const articles = result.rows;

  return (
    <div className="admin-full-container">
      <div className="admin-header-flex">
        <h2>Painel de Controle</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin/nova-noticia" className="btn">Nova Notícia</Link>
          <form action={logout}>
            <button type="submit" className="btn btn-outline">Sair</button>
          </form>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Slug</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td>{article.id}</td>
              <td>{article.title}</td>
              <td>{article.slug}</td>
              <td>{new Date(article.created_at).toLocaleDateString('pt-BR')}</td>
              <td>
                <Link href={`/noticia/${article.slug}`} target="_blank" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                  Ver
                </Link>
              </td>
            </tr>
          ))}
          {articles.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>Nenhuma notícia cadastrada.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
