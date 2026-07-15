export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://fuxicos.dluz.com.br/sitemap.xml
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
