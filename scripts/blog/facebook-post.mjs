// Facts for the Facebook post of a published blog post (the caption itself is written by the worker).
//
//   node scripts/blog/facebook-post.mjs <english-slug>
//
// Checks the English page is live and prints JSON: link, title, description and imageUrl (the cover as the
// site serves it, 1200 px JPEG, which Facebook accepts). Exits 1 if the page is not live yet.
const slug = process.argv[2];
if (!slug) { console.log('Usage: node scripts/blog/facebook-post.mjs <english-slug>'); process.exit(2); }
const link = `https://mexisol.world/blog/${slug}`;
const res = await fetch(link, { redirect: 'follow' });
if (res.status !== 200) { console.error(`${link} returned ${res.status}; not live yet`); process.exit(1); }
const html = await res.text();
const meta = (p) => html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`))?.[1]?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const cover = html.match(/<img[^>]*class="ratio-16-9"[^>]*>/)?.[0] ?? '';
const set = cover.match(/srcset="([^"]*)"/)?.[1].split(',').map((s) => s.trim().split(/\s+/)) ?? [];
const pick = set.find(([, w]) => w === '1200w') ?? set.at(-1);
const imageUrl = pick ? new URL(pick[0], link).href : meta('og:image');
console.log(JSON.stringify({ slug, link, title: meta('og:title')?.replace(/ \| MexiSol World$/, ''), description: meta('og:description'), imageUrl }, null, 2));
