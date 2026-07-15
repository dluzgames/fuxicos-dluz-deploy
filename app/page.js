import Link from 'next/link';
import Image from 'next/image';
import { query } from '@/lib/db';

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  const result = await query(
    "SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC LIMIT 20"
  );
  const articles = result.rows;

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <h1 className="title-primary">As exclusivas que você só vê aqui</h1>
          <p>Cobertura completa dos bastidores da TV, fofocas e os escândalos do mundo das celebridades.</p>
        </div>
      </section>

      <section className="container">
        <div className="news-grid">
          {articles.map((article) => (
            <Link href={`/noticia/${article.slug}`} key={article.id} className="news-card">
              <div className="card-img-wrapper">
                <span className="card-category">{article.category || 'Famosos'}</span>
                {article.image_url && (
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={false}
                  />
                )}
              </div>
              <div className="card-content">
                <h3 className="card-title">{article.title}</h3>
                <p className="card-excerpt">{article.excerpt}</p>
                <div className="card-meta">
                  <span>{new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Ler mais</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="policy-section">
        <h2>Nossa Política Editorial</h2>
        <p>
          O Fuxi Dluz compromete-se com a informação responsável, entregando resumos autorais de notícias 
          do mundo das celebridades. Todos os fatos são apurados e creditamos as fontes originais ao final de 
          cada matéria, garantindo a transparência e respeito ao jornalismo. Nossas imagens são cuidadosamente 
          licenciadas, prezando pela legalidade e qualidade.
        </p>
      </section>
    </>
  );
}
