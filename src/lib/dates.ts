import { monthName, type Lang } from './i18n';

const SHORT = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
};

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
}

/** "January 16-22" or "May 13 - June 22"; short: "Jan 16-22". Spanish: "16-22 de enero", "16-22 ene". */
export function dateRange(start: string, end: string, short = false, lang: Lang = 'en'): string {
  const a = parts(start);
  const b = parts(end);
  const name = (m: number) => (short ? SHORT[lang][m] : monthName(m, lang));
  if (lang === 'es') {
    const of = short ? ' ' : ' de ';
    if (a.m === b.m) return `${a.d}-${b.d}${of}${name(a.m)}`;
    return `${a.d}${of}${name(a.m)} - ${b.d}${of}${name(b.m)}`;
  }
  if (a.m === b.m) return `${name(a.m)} ${a.d}-${b.d}`;
  return `${name(a.m)} ${a.d} - ${name(b.m)} ${b.d}`;
}

/** Like dateRange, but adds the year when it is not the main calendar year. */
export function retreatDates(start: string, end: string, mainYear: number, short = false, lang: Lang = 'en'): string {
  const y = Number(start.slice(0, 4));
  const y2 = Number(end.slice(0, 4));
  if (y !== y2) {
    // Crosses New Year: give each date its own year. "December 28, 2026 - January 2, 2027"
    const one = (iso: string) => {
      const { y, m, d } = parts(iso);
      const name = short ? SHORT[lang][m] : monthName(m, lang);
      if (lang === 'es') return short ? `${d} ${name} ${y}` : `${d} de ${name} de ${y}`;
      return `${name} ${d}, ${y}`;
    };
    return `${one(start)} - ${one(end)}`;
  }
  const range = dateRange(start, end, short, lang);
  return y === mainYear ? range : `${range}${lang === 'es' ? ' de' : ','} ${y}`;
}
