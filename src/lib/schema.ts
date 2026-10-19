// JSON-LD builders. Every value comes from src/data; nothing is invented here.
import site from '../data/site.json';
import rooms from '../data/rooms.json';
import { absolute } from './url';

export const fincaPlace = {
  '@type': 'LodgingBusiness',
  '@id': `${site.url}/finca-el-pendulo#place`,
  name: 'Finca El Péndulo',
  url: absolute('/finca-el-pendulo'),
  telephone: site.whatsapp.display.replace(/\s/g, ''),
  email: site.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    postalCode: site.address.postalCode,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  },
  ...(site.geo.latitude != null && site.geo.longitude != null
    ? { geo: { '@type': 'GeoCoordinates', latitude: site.geo.latitude, longitude: site.geo.longitude } }
    : {}),
  priceRange: `$${rooms.rooms[0].priceUsd}-$${rooms.rooms[rooms.rooms.length - 1].priceUsd} USD`,
};

interface EventInput {
  name: string;
  start: string;
  end: string;
  description: string;
  url: string;
  location: Record<string, unknown>;
  prices?: { name: string; priceUsd: number }[];
  bookingUrl?: string;
}

export function event(e: EventInput) {
  const offerUrl = e.bookingUrl || absolute('/#register');
  return {
    '@type': 'Event',
    name: e.name,
    startDate: e.start,
    endDate: e.end,
    description: e.description,
    url: e.url,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: e.location,
    organizer: { '@id': `${site.url}/#organization` },
    image: [`${site.url}/og/home.jpg`],
    ...(e.prices?.length
      ? {
          offers: e.prices.map((p) => ({
            '@type': 'Offer',
            name: p.name,
            price: p.priceUsd,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: offerUrl,
          })),
        }
      : {}),
  };
}

export const fincaLocation = { '@id': `${site.url}/finca-el-pendulo#place` };
export function placeIn(name: string, country: string) {
  return { '@type': 'Place', name, address: { '@type': 'PostalAddress', addressLocality: name.split(',')[0], addressCountry: country } };
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}
