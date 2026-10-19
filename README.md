# MexiSol World website

The site for [mexisol.world](https://mexisol.world): ayahuasca and psilocybin retreats at Finca El Péndulo, Jalisco, and international retreats. Built with [Astro](https://astro.build) as plain static HTML and deployed to GitHub Pages.

- Design canvas (source of truth for layout and copy): https://claude.ai/code/artifact/060371f1-b382-4aa7-8632-61fc224117e8
- Design system (colours, type, logos): https://claude.ai/code/artifact/b51b0672-f41f-4015-9524-76a7259021c8

## Edit dates, prices and contact details

You never need to touch a layout for these:

| What | File |
| --- | --- |
| Retreat dates, titles, booking links (Finca and international) | `src/data/retreats.json` |
| Room types, prices, airport pickup | `src/data/rooms.json` |
| Email, WhatsApp, Instagram, YouTube, address, map pin, GA4 ID, Turnstile key, form endpoint | `src/data/site.json` |

- Dates use `YYYY-MM-DD`. The site formats them ("January 16-22").
- A booking link (`bookingUrl`) turns that retreat's Register buttons into direct booking links. Empty means the button goes to the registration form.
- An international retreat with `priceUsd` gets that price in Google's event data.

Commit the change to `main` and the site rebuilds and deploys by itself in about three minutes.

## Run it on your computer

Needs Node 22 or newer.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # writes dist/
npm run preview    # serves dist/ at http://localhost:4321
```

Other scripts:

- `npm run lint`: type check
- `npm run links`: broken link and placeholder check on `dist/` (run after a build)
- `npm run lighthouse`: Lighthouse budget on every page (needs Chrome)
- `npm run icons`: rebuilds favicons and social images from `brand-src/` and `scripts/og.json`

## Photos and video

- Photos live in `src/assets/photos/`. Astro turns each into AVIF and WebP at several widths when it builds. Replace a file with a better version of the same name and everything updates.
- Source photos for the web are on the FINCA EL PENDULO drive under `Selección de fotos y videos/Mejores Fotos - Web y Redes/`.
- The Finca page header video is `public/video/finca-aerial.mp4` and `.webm`, cut from `Videos Destacados/01 Aereas/0006_DJI_20250619172714_0250_D.MP4`. It only plays on wide screens and never for visitors who prefer reduced motion.

## Deploy

`.github/workflows/deploy.yml` runs on every push to `main`:

1. Secret scan (gitleaks)
2. Type check, build, broken link check, Lighthouse budget (Performance, Accessibility, Best Practices 90 or higher; LCP under 2.5 s; CLS under 0.1; TBT under 200 ms)
3. Build for GitHub Pages and deploy

Pull requests run steps 1 and 2 without deploying. GitHub Pages has no per-PR preview URLs.

## Registration form

The form posts to a Cloudflare Worker in `worker/`, which checks the fields, the honeypot, the time to submit and Cloudflare Turnstile, then creates or updates the contact in GoHighLevel through its API, with the tag `website-registration` and a note holding the retreat and message. This uses no premium workflow trigger. Secrets never go in this repo:

```bash
cd worker
npx wrangler login
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put GHL_TOKEN
npx wrangler secret put GHL_LOCATION_ID
npx wrangler deploy
```

Then put the Worker's URL in `formEndpoint` in `src/data/site.json`.

In GoHighLevel, a free **Contact Tag** trigger (tag `website-registration` added) can send you an internal email or WhatsApp alert for each new registration.

## Launch checklist

The site is hidden from search engines until launch (`"launched": false` in `src/data/site.json`, which writes `noindex` on every page and `Disallow: /` in robots.txt).

To launch:

1. Set `"launched": true` in `src/data/site.json`.
2. In the repo settings, add the Actions variable `BASE_PATH` with the value `/`.
3. Add the custom domain `mexisol.world` in Settings › Pages, and these DNS records at Hostinger: four `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a `CNAME` for `www` pointing to `fincaelpendulo-lab.github.io`.
4. Tick "Enforce HTTPS" once the certificate is ready.
5. Submit `https://mexisol.world/sitemap-index.xml` in Google Search Console.
