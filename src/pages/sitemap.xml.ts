import type { APIRoute } from 'astro';

// Two pages do not justify @astrojs/sitemap; keep this list in step with src/pages.
const paths = ['/', '/tour/'];

export const GET: APIRoute = ({ site }) => {
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
