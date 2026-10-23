// Every retreat from src/data/retreats.json in one list, for the Upcoming retreats
// page, its calendar and the Spanish pages.
import retreats from '../data/retreats.json';
import { localize, type Lang } from './i18n';

export type Kind = 'ayahuasca' | 'psilocybin' | 'finca' | 'international';

export interface Retreat {
  id: string;
  kind: Kind;
  title: string;
  place: string;
  note: string;
  start: string;
  end: string;
  page: string;
  bookingUrl: string;
}

// Spanish for every English string in retreats.json. Add a line here when you add a new title or note.
const es: Record<string, string> = {
  'Ayahuasca retreat': 'Retiro de ayahuasca',
  'Psilocybin retreat': 'Retiro de psilocibina',
  "Women's Retreat with Araisis": 'Retiro de mujeres con Araisis',
  'Familia Sagrada retreat': 'Retiro Familia Sagrada',
  'Master plant retreat': 'Retiro de plantas maestras',
  'Master plant dieta': 'Dieta de plantas maestras',
  'Europe tour': 'Gira por Europa',
  'With Humberto': 'Con Humberto',
  'With Krista': 'Con Krista',
  'For women · With Araisis': 'Para mujeres · Con Araisis',
  'With Sitka Healing House': 'Con Sitka Healing House',
  'Holy Week, with the Medicine and Music Festival': 'Semana Santa, con el Festival de Medicina y Música',
  'Chicago, USA': 'Chicago, EE. UU.',
  Europe: 'Europa',
  'Two days in the capital, on the way to the rainforest': 'Dos días en la capital, camino a la selva',
  'In the Amazon rainforest': 'En la selva amazónica',
  'Two weeks on the banks of the Ganges': 'Dos semanas a orillas del Ganges',
  'Starting in Alicante, Spain.': 'Empieza en Alicante, España.',
  'Ten days with one teacher plant, a simple diet and long stretches of quiet. Meant for people who have already sat in ceremony.':
    'Diez días con una planta maestra, una dieta sencilla y largos ratos de silencio. Pensada para personas que ya han estado en ceremonia.',
};
export const tr = (s: string, lang: Lang) => (lang === 'es' ? es[s] ?? s : s);

const medicinePage: Record<string, string> = {
  ayahuasca: '/ayahuasca-retreat',
  psilocybin: '/psilocybin-retreat',
  wellness: '/sitka-sol-wellness-retreat',
  women: '/womens-retreat',
};

/** All retreats that have not ended yet on the day the site is built, by start date. */
export function upcoming(lang: Lang = 'en', today = new Date().toISOString().slice(0, 10)): Retreat[] {
  const finca: Retreat[] = retreats.finca.map((r) => ({
    id: r.id,
    kind: r.medicine === 'ayahuasca' || r.medicine === 'psilocybin' ? r.medicine : 'finca',
    title: tr(r.title, lang),
    place: 'Finca El Péndulo, Jalisco',
    note: tr(r.guide, lang),
    start: r.start,
    end: r.end,
    page: localize(medicinePage[r.medicine] ?? '/finca-el-pendulo#dates', lang),
    bookingUrl: r.bookingUrl,
  }));
  const international: Retreat[] = retreats.international.map((r) => ({
    id: r.id,
    kind: 'international',
    title: tr(r.title, lang),
    place: tr(r.location, lang),
    note: tr(r.subtitle, lang),
    start: r.start,
    end: r.end,
    page: localize('/international-retreats', lang),
    bookingUrl: r.bookingUrl,
  }));
  return [...finca, ...international].filter((r) => r.end >= today).sort((a, b) => a.start.localeCompare(b.start));
}
