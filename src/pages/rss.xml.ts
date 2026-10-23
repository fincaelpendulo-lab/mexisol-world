import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { posts, postPath } from '../lib/blog';

export async function GET(context: APIContext) {
  const list = await posts('en');
  return rss({
    title: 'MexiSol World blog',
    description: 'Guides to ayahuasca, psilocybin and plant medicine retreats at Finca El Péndulo, Jalisco.',
    site: context.site!,
    items: list.map((p) => ({ title: p.data.title, description: p.data.description, pubDate: p.data.date, link: postPath(p) })),
    customData: '<language>en</language>',
  });
}
