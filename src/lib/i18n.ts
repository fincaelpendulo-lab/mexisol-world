// English is the default at /; Spanish pages live under /es/ with Spanish slugs.
// Every English page with a Spanish counterpart is listed here, so the language
// switch and the hreflang tags always point at the matching page.
export type Lang = 'en' | 'es';

export const esRoutes: Record<string, string> = {
  '/': '/es',
  '/upcoming-retreats': '/es/proximos-retiros',
  '/finca-el-pendulo': '/es/finca-el-pendulo',
  '/international-retreats': '/es/retiros-internacionales',
  '/ayahuasca-retreat': '/es/retiro-de-ayahuasca',
  '/psilocybin-retreat': '/es/retiro-de-psilocibina',
  '/sitka-sol-wellness-retreat': '/es/retiro-sitka-sol',
  '/womens-retreat': '/es/retiro-de-mujeres',
  '/prepare': '/es/preparacion',
  '/medical': '/es/informacion-medica',
  '/about': '/es/nosotros',
  '/privacy': '/es/privacidad',
  '/terms': '/es/terminos',
  '/blog': '/es/blog',
};
const enRoutes = Object.fromEntries(Object.entries(esRoutes).map(([en, es]) => [es, en]));

/** The path of a page in the given language, keeping any #hash. "/about#team" → "/es/nosotros#team". */
export function localize(path: string, lang: Lang): string {
  if (lang === 'en' || /^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const [p, hash] = path.split('#');
  const [clean, query] = p.split('?');
  const es = esRoutes[clean || '/'] ?? (clean.startsWith('/blog/') ? `/es${clean}` : clean);
  return `${es}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

/** The English and Spanish versions of a page, or null for a language it does not exist in. */
export function counterparts(path: string, lang: Lang): { en: string | null; es: string | null } {
  if (lang === 'en') return { en: path, es: esRoutes[path] ?? null };
  return { en: enRoutes[path] ?? null, es: path };
}

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};
export const monthName = (m: number, lang: Lang) => MONTHS[lang][m];

/** Strings used by shared components. Page copy lives in the pages themselves. */
export const ui = {
  en: {
    skip: 'Skip to content',
    home: 'MexiSol World home',
    menu: 'Menu',
    nav: {
      home: 'MexiSol',
      upcoming: 'Upcoming retreats',
      allDates: 'All dates and calendar',
      finca: 'Finca El Péndulo retreats',
      international: 'International retreats',
      resources: 'Resources',
      ayahuasca: 'Ayahuasca retreats',
      psilocybin: 'Psilocybin retreats',
      prepare: 'Prepare and travel',
      medical: 'Medical information',
      blog: 'Blog',
      about: 'About us',
      story: 'Our story',
      team: 'Our team',
      youtube: 'Finca El Péndulo on YouTube',
      register: 'Register',
    },
    switchLabel: 'ES',
    switchLong: 'Leer en español',
    switchAria: 'Ver esta página en español',
    whatsappAria: 'Message us on WhatsApp',
    footer: {
      tagline: 'Ayahuasca and psilocybin retreats at Finca El Péndulo, Jalisco, and retreats worldwide.',
      retreats: 'Retreats',
      finca: 'Finca El Péndulo',
      international: 'International',
      calendar: 'Calendar',
      contact: 'Contact',
      legal: 'Every guest is screened before confirming. Our retreats are not a substitute for medical or psychological care.',
      privacy: 'Privacy',
      terms: 'Terms',
      cookies: 'Cookie settings',
    },
  },
  es: {
    skip: 'Ir al contenido',
    home: 'Inicio de MexiSol World',
    menu: 'Menú',
    nav: {
      home: 'MexiSol',
      upcoming: 'Próximos retiros',
      allDates: 'Todas las fechas y calendario',
      finca: 'Retiros en Finca El Péndulo',
      international: 'Retiros internacionales',
      resources: 'Recursos',
      ayahuasca: 'Retiros de ayahuasca',
      psilocybin: 'Retiros de psilocibina',
      prepare: 'Preparación y viaje',
      medical: 'Información médica',
      blog: 'Blog',
      about: 'Nosotros',
      story: 'Nuestra historia',
      team: 'Nuestro equipo',
      youtube: 'Finca El Péndulo en YouTube',
      register: 'Regístrate',
    },
    switchLabel: 'EN',
    switchLong: 'Read in English',
    switchAria: 'View this page in English',
    whatsappAria: 'Escríbenos por WhatsApp',
    footer: {
      tagline: 'Retiros de ayahuasca y psilocibina en Finca El Péndulo, Jalisco, y retiros por el mundo.',
      retreats: 'Retiros',
      finca: 'Finca El Péndulo',
      international: 'Internacionales',
      calendar: 'Calendario',
      contact: 'Contacto',
      legal: 'Cada participante pasa por una evaluación antes de confirmar. Nuestros retiros no sustituyen la atención médica ni psicológica.',
      privacy: 'Privacidad',
      terms: 'Términos',
      cookies: 'Configurar cookies',
    },
  },
} as const;
