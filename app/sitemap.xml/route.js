import { query } from '@/lib/db';

export async function GET() {
  const result = await query('SELECT slug, updated_at FROM articles ORDER BY updated_at DESC');
  const articles = result.rows;

  const baseUrl = 'https://fuxicos.dluz.com.br';

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  ${articles
    .map(
      (article) => `
  <url>
    <loc>${baseUrl}/noticia/${article.slug}</loc>
    <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
