// Receives the MexiSol World registration form, checks it again on the server
// (fields, honeypot, time to submit, Cloudflare Turnstile) and saves the lead in
// GoHighLevel through its API: the contact is created or updated with the retreat
// details, a first lead score and a temperature tag, then tagged
// "website-registration", which starts the "Request info" workflow in GoHighLevel.
// The message is also added as a note. Secrets live in Cloudflare, never in the repo.

import { idFromLabel, retreatInfo, upcoming, score, temperature, TEMPERATURE_TAGS } from './leads.js';

const GHL = 'https://services.leadconnectorhq.com';
const GHL_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  Version: '2021-07-28',
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;
const MIN_SECONDS = 3;

// Custom fields for the retreat and the message. Found by name, created if missing,
// and remembered while the Worker stays warm.
const FIELDS = {
  retreat: { name: 'Retiro de interés', dataType: 'TEXT' },
  message: { name: 'Mensaje del sitio web', dataType: 'LARGE_TEXT' },
  retreatName: { name: 'Retreat name', dataType: 'TEXT' },
  retreatDates: { name: 'Retreat dates', dataType: 'TEXT' },
  retreatGuide: { name: 'Retreat guide', dataType: 'TEXT' },
  retreatSummary: { name: 'Retreat summary', dataType: 'LARGE_TEXT' },
  retreatPage: { name: 'Retreat page', dataType: 'TEXT' },
  retreatBooking: { name: 'Retreat booking link', dataType: 'TEXT' },
  upcoming: { name: 'Upcoming retreats', dataType: 'LARGE_TEXT' },
  score: { name: 'Lead score', dataType: 'NUMERICAL' },
};
let fieldIds = null;
async function ensureFields(env) {
  if (fieldIds) return fieldIds;
  const base = `${GHL}/locations/${env.GHL_LOCATION_ID}/customFields`;
  const list = await fetch(base, { headers: GHL_HEADERS(env.GHL_TOKEN) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!list) return null;
  const ids = {};
  for (const [key, def] of Object.entries(FIELDS)) {
    const found = (list.customFields || []).find((f) => f.name.toLowerCase() === def.name.toLowerCase());
    if (found) { ids[key] = found.id; continue; }
    const made = await fetch(base, { method: 'POST', headers: GHL_HEADERS(env.GHL_TOKEN), body: JSON.stringify({ ...def, model: 'contact' }) })
      .then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (made?.customField?.id) ids[key] = made.customField.id;
  }
  // Only remember a complete set, so a field that failed to save is tried again next time.
  if (Object.keys(ids).length === Object.keys(FIELDS).length) fieldIds = ids;
  return ids;
}

const LISTS = {
  newsletter: { tag: 'newsletter-100usd', source: 'mexisol.world newsletter ($100 USD off)' },
  calendar: { tag: 'calendar-2027', source: 'mexisol.world 2027 calendar request' },
};

async function subscribe(form, env, headers) {
  const email = String(form.get('email') || '').trim().slice(0, 160);
  const list = LISTS[String(form.get('list') || '')];
  const started = Number(form.get('_started') || 0);
  if (String(form.get('website') || '') || !started || Date.now() - started < 2000) return reply({ ok: true }, 200, headers);
  if (!list) return reply({ ok: false, error: 'list' }, 400, headers);
  if (!EMAIL_RE.test(email)) return reply({ ok: false, errors: { email: 'invalid' } }, 422, headers);
  const name = String(form.get('name') || '').trim().slice(0, 120);
  const [firstName, ...rest] = name ? name.split(/\s+/) : [];
  const res = await fetch(`${GHL}/contacts/upsert`, {
    method: 'POST',
    headers: GHL_HEADERS(env.GHL_TOKEN),
    body: JSON.stringify({
      locationId: env.GHL_LOCATION_ID,
      email,
      ...(firstName ? { firstName, lastName: rest.join(' ') } : {}),
      source: list.source,
    }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const contactId = res?.contact?.id;
  if (!contactId) return reply({ ok: false, error: 'crm' }, 502, headers);
  await tags(env, contactId, 'POST', [list.tag]);
  return reply({ ok: true }, 200, headers);
}

// Upsert would replace every tag on the contact, so tags go through their own endpoint.
function tags(env, contactId, method, list) {
  return fetch(`${GHL}/contacts/${contactId}/tags`, { method, headers: GHL_HEADERS(env.GHL_TOKEN), body: JSON.stringify({ tags: list }) })
    .then((r) => r.ok)
    .catch(() => false);
}

function cors(origin, allowed) {
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function reply(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
    const origin = request.headers.get('Origin') || '';
    const headers = cors(origin, allowed);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply({ ok: false, error: 'method' }, 405, headers);
    if (origin && !allowed.includes(origin)) return reply({ ok: false, error: 'origin' }, 403, headers);

    let form;
    try { form = await request.formData(); } catch { return reply({ ok: false, error: 'body' }, 400, headers); }

    // Newsletter and 2027-calendar sign-ups: email only, honeypot and time check, no captcha.
    if (new URL(request.url).pathname === '/subscribe') return subscribe(form, env, headers);
    const get = (k, max) => String(form.get(k) || '').trim().slice(0, max);

    // Bots: honeypot filled or submitted too fast. Answer "ok" so they learn nothing.
    const started = Number(form.get('_started') || 0);
    if (get('website', 200) || !started || Date.now() - started < MIN_SECONDS * 1000) {
      return reply({ ok: true }, 200, headers);
    }

    const lead = {
      name: get('name', 120),
      email: get('email', 160),
      phone: get('phone', 24),
      retreat: get('retreat', 120),
      retreatId: get('retreat_id', 40),
      message: get('message', 2000),
    };
    const errors = {};
    if (lead.name.length < 2) errors.name = 'required';
    if (!EMAIL_RE.test(lead.email)) errors.email = 'invalid';
    if (lead.phone && !PHONE_RE.test(lead.phone)) errors.phone = 'invalid';
    if (Object.keys(errors).length) return reply({ ok: false, errors }, 422, headers);

    const token = get('cf-turnstile-response', 2048);
    const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: request.headers.get('CF-Connecting-IP') || '' }),
    }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!check.success) return reply({ ok: false, error: 'captcha' }, 403, headers);

    const [firstName, ...rest] = lead.name.split(/\s+/);
    const ids = (await ensureFields(env)) || {};
    const info = retreatInfo(lead.retreatId || idFromLabel(lead.retreat));
    const points = score({ info, phone: lead.phone, message: lead.message });
    const values = {
      retreat: lead.retreat,
      message: lead.message,
      retreatName: info.name,
      retreatDates: info.dates,
      retreatGuide: info.guide,
      retreatSummary: info.summary,
      retreatPage: info.page,
      retreatBooking: info.booking,
      upcoming: upcoming(),
      score: points,
    };
    const customFields = Object.entries(values)
      .filter(([key, value]) => ids[key] && value !== '' && value != null)
      .map(([key, value]) => ({ id: ids[key], field_value: value }));
    const upsert = await fetch(`${GHL}/contacts/upsert`, {
      method: 'POST',
      headers: GHL_HEADERS(env.GHL_TOKEN),
      body: JSON.stringify({
        locationId: env.GHL_LOCATION_ID,
        firstName,
        lastName: rest.join(' '),
        name: lead.name,
        email: lead.email,
        ...(lead.phone ? { phone: lead.phone } : {}),
        source: 'mexisol.world registration form',
        ...(customFields.length ? { customFields } : {}),
      }),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const contactId = upsert?.contact?.id;
    if (!contactId) return reply({ ok: false, error: 'crm' }, 502, headers);

    // Fields are saved first, then the tags. Removing "website-registration" before
    // adding it again makes the workflow start for repeat requests too.
    const temp = temperature(points);
    await tags(env, contactId, 'DELETE', ['website-registration', ...TEMPERATURE_TAGS.filter((t) => t !== temp)]);
    await tags(env, contactId, 'POST', [temp, ...(lead.retreat ? [`retiro: ${lead.retreat}`] : [])]);
    await tags(env, contactId, 'POST', ['website-registration']);

    const note = [
      `Website registration (${new Date().toISOString().slice(0, 10)})`,
      `Retreat: ${lead.retreat || 'not chosen'}`,
      `Lead score: ${points} (${temp})`,
      `WhatsApp: ${lead.phone || 'not given'}`,
      '',
      lead.message || '(no message)',
    ].join('\n');
    // The contact is already saved; a failed note should not show the visitor an error.
    await fetch(`${GHL}/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: GHL_HEADERS(env.GHL_TOKEN),
      body: JSON.stringify({ body: note }),
    }).catch(() => null);

    return reply({ ok: true }, 200, headers);
  },
};
