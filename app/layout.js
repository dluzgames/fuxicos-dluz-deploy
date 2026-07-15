import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Fuxi Dluz - Notícias dos Famosos, TV e Entretenimento',
  description: 'O melhor portal de entretenimento e fofocas. Fique por dentro de tudo sobre as celebridades.',
  metadataBase: new URL('https://fuxicos.dluz.com.br'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="main-header">
          <div className="container">
            <Link href="/" className="logo">
              Fuxi<span>Dluz</span>
            </Link>
            <nav className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="main-footer">
          <div className="container">
            <div className="footer-content">
              <div>
                <Link href="/" className="logo">
                  Fuxi<span>Dluz</span>
                </Link>
                <p className="footer-text" style={{ marginTop: '1rem' }}>
                  A sua fonte premium de notícias sobre celebridades, reality shows e os bastidores do entretenimento.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4 style={{ color: '#fff' }}>Links Rápidos</h4>
                <Link href="/">Últimas Notícias</Link>
                <Link href="/admin">Área Restrita</Link>
              </div>
            </div>
            <div className="footer-bottom">
              &copy; {new Date().getFullYear()} Fuxi Dluz. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
