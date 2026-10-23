import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from './i18n';

export type Post = CollectionEntry<'blog'>;

/** "en/what-is-satori" → "what-is-satori" */
export const slugOf = (post: Post) => post.id.split('/').slice(1).join('/');
export const langOf = (post: Post): Lang => (post.id.startsWith('es/') ? 'es' : 'en');
export const postPath = (post: Post) => `${langOf(post) === 'es' ? '/es' : ''}/blog/${slugOf(post)}`;

/** Published posts in one language, newest first. */
export async function posts(lang: Lang): Promise<Post[]> {
  const now = new Date();
  const all = await getCollection('blog', (p) => langOf(p) === lang && !p.data.draft && p.data.date <= now);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Minutes to read, at about 220 words a minute. */
export function readingTime(post: Post): number {
  const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
export const wordCount = (post: Post) => (post.body ?? '').split(/\s+/).filter(Boolean).length;

export function formatDate(d: Date, lang: Lang): string {
  return d.toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
