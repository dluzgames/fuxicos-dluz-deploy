import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function logout() {
  'use server';
  cookies().delete('admin_session');
  redirect('/admin/login');
}

export default function AdminLayout({ children }) {
  // Check if we are on the login page (we can check cookies loosely or just render children since login page handles its own layout, but wait!
  // In Next.js, layout applies to all subdirectories including /login.
  // To avoid showing navigation on /admin/login, we can read the cookie. If it's missing, we don't render the admin header/navigation.
  const hasSession = cookies().has('admin_session');

  if (!hasSession) {
    return <>{children}</>;
  }

  return (
    <div className="admin-layout-wrapper">
      <div className="admin-nav-bar">
        <div className="container admin-nav-flex">
          <div className="admin-nav-brand">
            Painel <span>Fuxi Dluz</span>
          </div>
          <nav className="admin-nav-links">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/agente">Gerar Artigo (IA)</Link>
            <Link href="/admin/feeds">Feeds RSS</Link>
            <Link href="/admin/ia-historico">Histórico IA</Link>
            <Link href="/admin/nova-noticia">Nova Notícia (Manual)</Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Sair</button>
          </form>
        </div>
      </div>
      <main className="admin-main-content">
        {children}
      </main>
    </div>
  );
}
