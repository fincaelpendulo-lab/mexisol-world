// Retreat details and a first lead score for each registration. The details are
// written to GoHighLevel custom fields so the "Request info" workflow can send one
// email template that still talks about the retreat the person chose.
import retreats from '../../src/data/retreats.json';

const SITE = 'https://mexisol.world';
const WHATSAPP = 'https://wa.me/523787900992';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Same wording as src/lib/dates.ts.
function range(start, end) {
  const [, am, ad] = start.split('-').map(Number);
  const [, bm, bd] = end.split('-').map(Number);
  return am === bm ? `${MONTHS[am - 1]} ${ad}-${bd}` : `${MONTHS[am - 1]} ${ad} - ${MONTHS[bm - 1]} ${bd}`;
}
const dates = (start, end) => `${range(start, end)}, ${start.slice(0, 4)}`;
// "For women · With Araisis" -> "With Araisis"; empty when the guide line names no one.
const guideOf = (r) => { const g = r.guide.split('·').pop().trim(); return /^with /i.test(g) ? g : ''; };

/**
 * Retreat id from the label the form shows (e.g. "Ayahuasca, January 16-22"), for
 * pages cached before the form also sent the id. Same labels as RegisterForm.astro.
 */
export function idFromLabel(label) {
  const want = String(label || '').trim().toLowerCase();
  if (!want) return '';
  const withYear = (r) => (Number(r.start.slice(0, 4)) === retreats.year ? '' : `, ${r.start.slice(0, 4)}`);
  const finca = retreats.finca.find((r) => `${r.title.replace(/ retreat$/, '')}, ${range(r.start, r.end)}${withYear(r)}`.toLowerCase() === want);
  if (finca) return finca.id;
  const intl = retreats.international.find((r) => `${r.location === 'Europe' ? r.title : r.location}, ${range(r.start, r.end)}`.toLowerCase() === want);
  return intl ? intl.id : '';
}

// Medicine or event type: page on the site and a short description for the email.
const KINDS = {
  ayahuasca: {
    page: '/ayahuasca-retreat',
    summary: 'Seven days at Finca El Péndulo with two ayahuasca ceremonies and one with Satori, led by Humberto. Up to 15 guests. From $1,850 USD per person, with meals, activities and your room included.',
  },
  psilocybin: {
    page: '/psilocybin-retreat',
    summary: 'Seven days at Finca El Péndulo with two psilocybin mushroom ceremonies and one with Satori, led by Krista. Many people find mushrooms easier on the body than ayahuasca. Up to 15 guests. From $1,850 USD per person, with meals, activities and your room included.',
  },
  wellness: {
    page: '/sitka-sol-wellness-retreat',
    summary: 'Five days with Sitka Healing House: a deep liver cleanse, educational sessions, movement, meditation, live music and sound healing. Meals and rooms included.',
  },
  women: {
    page: '/womens-retreat',
    summary: "A women's retreat with Araisis: two sacred mushroom ceremonies, music medicine, cacao, kambo, voice activation, astrology workshops and temazcal. Booking is handled by Araisis, who set up a short call with you before confirming your place.",
  },
  newyear: {
    page: '/new-year-retreat',
    summary: 'Close the year at Finca El Péndulo. Three packages: a full retreat, ceremony and celebration, or the celebration only, with lodging and activities included. From $1,650 MXN per person. We book on WhatsApp and help you choose your package and room.',
  },
  'familia-sagrada': {
    page: '/#next',
    summary: 'Holy Week at the Finca, together with the Medicine and Music Festival. We are closing the last details and prices, and we will write to you as soon as they are ready.',
  },
  international: {
    page: '/international-retreats',
    summary: 'Led by the same team that hosts at Finca El Péndulo. Prices and booking details are on their way, and we will send them to you first.',
  },
};

const NOT_SURE = {
  name: 'Help choosing your retreat',
  dates: '',
  guide: '',
  page: `${SITE}/#next`,
  booking: WHATSAPP,
  summary: 'Not sure which retreat fits? Ayahuasca tends to go deeper and asks more of the body. Psilocybin is often gentler on the body. Both run for seven days at the Finca. Reply to this email with a little about yourself and we will help you choose.',
  start: '',
};

/** Everything the email needs about the retreat with this id (or the "not sure" text). */
export function retreatInfo(id) {
  const finca = retreats.finca.find((r) => r.id === id);
  if (finca) {
    const kind = KINDS[finca.medicine] || {};
    const page = `${SITE}${kind.page || '/'}`;
    return {
      name: finca.title,
      dates: dates(finca.start, finca.end),
      guide: guideOf(finca),
      page,
      booking: finca.bookingUrl || (finca.noPrice ? page : WHATSAPP),
      summary: [finca.subtitle, kind.summary].filter(Boolean).join('. '),
      start: finca.start,
    };
  }
  const intl = retreats.international.find((r) => r.id === id);
  if (intl) {
    return {
      name: intl.location === 'Europe' ? intl.title : `${intl.title}, ${intl.location}`,
      dates: dates(intl.start, intl.end),
      guide: 'With the MexiSol World team',
      page: `${SITE}${KINDS.international.page}`,
      booking: intl.bookingUrl || WHATSAPP,
      summary: [intl.subtitle, intl.description, KINDS.international.summary].filter(Boolean).join(' '),
      start: intl.start,
    };
  }
  return NOT_SURE;
}

/** The next few retreats at the Finca, one per line, as simple HTML for the email. */
export function upcoming(today = new Date().toISOString().slice(0, 10), count = 4) {
  return retreats.finca
    .filter((r) => r.start > today)
    .slice(0, count)
    .map((r) => { const g = guideOf(r); const named = g && !r.title.toLowerCase().includes(g.slice(5).toLowerCase()); return `${dates(r.start, r.end)}: ${r.title}${named ? `, w${g.slice(1)}` : ''}`; })
    .join('<br>');
}

/**
 * First lead score, 0-100, from what the form tells us. The workflow adds to it later
 * (replies, clicks on the booking link).
 */
export function score({ info, phone, message }, today = new Date()) {
  let points = 20; // filled in the registration form
  if (info !== NOT_SURE) points += 15;
  if (phone) points += 10;
  if (message && message.length >= 50) points += 5;
  if (info.start) {
    const days = (Date.parse(info.start) - today.getTime()) / 86400000;
    if (days <= 60) points += 15;
    else if (days <= 120) points += 5;
  }
  return points;
}

/** Temperature tag for a score. */
export function temperature(points) {
  if (points >= 50) return 'lead-caliente';
  if (points >= 30) return 'lead-tibio';
  return 'lead-frio';
}

export const TEMPERATURE_TAGS = ['lead-caliente', 'lead-tibio', 'lead-frio'];
