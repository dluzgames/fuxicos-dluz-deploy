import { query } from '@/lib/db';

export async function GET() {
  // Google News sitemap requires only articles from the last 2 days (48 hours)
  const result = await query(
    `SELECT title, slug, created_at FROM articles 
     WHERE status = 'published' AND created_at >= NOW() - INTERVAL '2 days' 
     ORDER BY created_at DESC`
  );
  const articles = result.rows;

  const baseUrl = 'https://fuxicos.dluz.com.br';

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${articles
    .map(
      (article) => `
  <url>
    <loc>${baseUrl}/noticia/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Fuxi Dluz</news:name>
        <news:language>pt-br</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.created_at).toISOString()}</news:publication_date>
      <news:title>${article.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</news:title>
    </news:news>
  </url>`
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
