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

/** Link to the registration form with a retreat already selected. */
export function registerHref(retreatId?: string): string {
  return href(retreatId ? `/?retreat=${retreatId}#register` : '/#register');
}

/** Google Translate's Spanish version of a page on the live domain (no script on our site). */
export function spanishHref(pathname: string): string {
  const host = new URL(site.url).hostname.replace(/-/g, '--').replace(/\./g, '-');
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const raw = (base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname) || '/';
  const path = raw.replace(/\/index\.html$/, '/').replace(/\.html$/, '') || '/';
  return `https://${host}.translate.goog${path}?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es`;
}
