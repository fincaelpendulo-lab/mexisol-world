import site from '../data/site.json';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Internal link that works under the GitHub Pages project path and on the custom domain. */
export function href(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const [p, hash] = path.split('#');
  const clean = p === '/' ? '/' : p.replace(/\/$/, '');
  return `${base}${clean}${hash ? `#${hash}` : ''}` || '/';
}

/** Canonical URL on the production domain, e.g. https://mexisol.world/about */
export function absolute(path: string): string {
  return path === '/' ? `${site.url}/` : `${site.url}${path.replace(/\/$/, '')}`;
}

export const whatsappUrl = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(site.whatsapp.message).replace(/'/g, '%27')}`;
