import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await query('SELECT * FROM articles WHERE slug = $1', [slug]);
  const article = result.rows[0];

  if (!article) {
    return { title: 'Notícia não encontrada | Fuxi Dluz' };
  }

  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    openGraph: {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      url: `https://fuxicos.dluz.com.br/noticia/${article.slug}`,
      type: 'article',
      publishedTime: article.created_at,
      images: [
        {
          url: article.image_url,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      images: [article.image_url],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const result = await query('SELECT * FROM articles WHERE slug = $1', [slug]);
  const article = result.rows[0];

  if (!article) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    image: [article.image_url],
    datePublished: article.created_at,
    dateModified: article.updated_at,
    author: [{
      '@type': 'Organization',
      name: 'Fuxi Dluz',
      url: 'https://fuxicos.dluz.com.br'
    }],
    publisher: {
      '@type': 'Organization',
      name: 'Fuxi Dluz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://fuxicos.dluz.com.br/logo.png'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="article-container">
        <header className="article-header">
          <span className="category">{article.category || 'Famosos'}</span>
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span>{new Date(article.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        {article.image_url && (
          <div>
            <Image
              src={article.image_url}
              alt={article.title}
              width={800}
              height={500}
              className="article-image"
              priority
            />
            {article.image_credit && (
              <div className="article-image-credit">Foto: {article.image_credit}</div>
            )}
          </div>
        )}

        <div className="article-body">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
          
          {article.source_link && (
            <div className="article-source">
              Informações apuradas originalmente por: <a href={article.source_link} target="_blank" rel="noopener noreferrer">{article.source_name || article.source_link}</a>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
