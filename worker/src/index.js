// Receives the MexiSol World registration form, checks it again on the server
// (fields, honeypot, time to submit, Cloudflare Turnstile) and saves the lead in
// GoHighLevel through its API (no premium workflow trigger needed): the contact is
// created or updated with the tag "website-registration", and the retreat and
// message are added as a note. Secrets live in Cloudflare, never in the repo.

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
const FIELDS = { retreat: { name: 'Retiro de interés', dataType: 'TEXT' }, message: { name: 'Mensaje del sitio web', dataType: 'LARGE_TEXT' } };
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
  fieldIds = ids;
  return ids;
}

const LISTS = {
  newsletter: { tag: 'newsletter-10off', source: 'mexisol.world newsletter (10% off)' },
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
      tags: [list.tag],
    }),
  }).catch(() => null);
  if (!res || !res.ok) return reply({ ok: false, error: 'crm' }, 502, headers);
  return reply({ ok: true }, 200, headers);
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
    const customFields = [
      ...(ids.retreat && lead.retreat ? [{ id: ids.retreat, field_value: lead.retreat }] : []),
      ...(ids.message && lead.message ? [{ id: ids.message, field_value: lead.message }] : []),
    ];
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
        // Tag per retreat so contacts can be filtered (e.g. "retiro: Ayahuasca, January 16-22").
        tags: ['website-registration', ...(lead.retreat ? [`retiro: ${lead.retreat}`] : [])],
      }),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const contactId = upsert?.contact?.id;
    if (!contactId) return reply({ ok: false, error: 'crm' }, 502, headers);

    const note = [
      `Website registration (${new Date().toISOString().slice(0, 10)})`,
      `Retreat: ${lead.retreat || 'not chosen'}`,
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
