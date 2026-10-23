import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { posts, postPath } from '../../lib/blog';

export async function GET(context: APIContext) {
  const list = await posts('es');
  return rss({
    title: 'Blog de MexiSol World',
    description: 'Guías sobre ayahuasca, psilocibina y retiros de medicina de plantas en Finca El Péndulo, Jalisco.',
    site: context.site!,
    items: list.map((p) => ({ title: p.data.title, description: p.data.description, pubDate: p.data.date, link: postPath(p) })),
    customData: '<language>es</language>',
  });
}
