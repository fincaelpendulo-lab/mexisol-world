// Receives the MexiSol World registration form, checks it again on the server
// (fields, honeypot, time to submit, Cloudflare Turnstile) and forwards the lead
// to a GoHighLevel inbound webhook. Secrets live in Cloudflare, never in the repo.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9\s().-]{7,20}$/;
const MIN_SECONDS = 3;

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
    const res = await fetch(env.GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...lead,
        first_name: firstName,
        last_name: rest.join(' '),
        source: 'mexisol.world registration form',
        submitted_at: new Date().toISOString(),
        page: request.headers.get('Referer') || '',
      }),
    }).catch(() => null);
    if (!res || !res.ok) return reply({ ok: false, error: 'crm' }, 502, headers);

    return reply({ ok: true }, 200, headers);
  },
};
