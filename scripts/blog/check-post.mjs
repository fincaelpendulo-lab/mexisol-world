// Checks a new blog post and its translation before it goes out for review.
//
//   node scripts/blog/check-post.mjs <english-slug>
//
// Errors (exit 1): missing fields, em dashes, too short, keyword missing from the title or opening,
// no Sources section, a source that does not load, broken internal links, missing photo or translation.
// For every DOI it prints the title Crossref has on record, and for every YouTube link the video title
// and channel, so the writer can confirm each source says what the post claims.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';
const errors = [];
const warnings = [];
const notes = [];

function parse(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: no frontmatter`);
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
  }
  return { data, body: m[2], text };
}

const words = (s) => s.replace(/[#*_>`|[\]()]/g, ' ').split(/\s+/).filter(Boolean);
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

function checkLang(lang, slug) {
  const file = join(root, 'src/content/blog', lang, `${slug}.md`);
  if (!existsSync(file)) { errors.push(`${lang}: ${file} does not exist`); return null; }
  const post = parse(file);
  const d = post.data;
  const tag = `${lang}/${slug}`;
  for (const key of ['title', 'description', 'date', 'image', 'imageAlt', 'imageCredit', 'imageCreditUrl', 'keyword', 'profile', 'translation']) {
    if (!d[key]) errors.push(`${tag}: frontmatter "${key}" is missing`);
  }
  if (d.title && d.title.length > 65) warnings.push(`${tag}: title is ${d.title.length} characters (aim for 60 or less)`);
  if (d.description && (d.description.length < 120 || d.description.length > 160)) errors.push(`${tag}: description is ${d.description.length} characters (120 to 160)`);
  if (/[—–]/.test(post.text)) errors.push(`${tag}: contains em or en dashes; rewrite those sentences`);
  const count = words(post.body).length;
  if (count < 1200) errors.push(`${tag}: ${count} words (minimum 1200)`);
  if (count > 3000) warnings.push(`${tag}: ${count} words; check it is not padded`);

  const kw = d.keyword ? norm(d.keyword) : '';
  if (kw) {
    const opening = norm(words(post.body.split(/\n## /)[0]).slice(0, 150).join(' '));
    if (!norm(d.title || '').includes(kw)) warnings.push(`${tag}: keyword "${d.keyword}" is not in the title word for word`);
    if (!opening.includes(kw)) errors.push(`${tag}: keyword "${d.keyword}" is not in the first 150 words`);
    if (!norm(d.description || '').includes(kw)) warnings.push(`${tag}: keyword is not in the description`);
    const h2 = [...post.body.matchAll(/^## (.+)$/gm)].map((m) => norm(m[1]));
    if (!h2.some((h) => kw.split(' ').filter((w) => w.length > 3).every((w) => h.includes(w)))) warnings.push(`${tag}: no H2 contains the keyword's main words`);
  }
  const h2s = [...post.body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  if (h2s.length < 4) errors.push(`${tag}: only ${h2s.length} H2 sections`);
  const faq = lang === 'es' ? /preguntas frecuentes/i : /frequently asked questions/i;
  if (!h2s.some((h) => faq.test(h))) warnings.push(`${tag}: no FAQ section`);

  const srcHead = lang === 'es' ? /^## Fuentes\s*$/m : /^## Sources\s*$/m;
  const srcIdx = post.body.search(srcHead);
  if (srcIdx < 0) errors.push(`${tag}: no "## ${lang === 'es' ? 'Fuentes' : 'Sources'}" section`);
  const sources = srcIdx < 0 ? [] : [...post.body.slice(srcIdx).matchAll(/\]\((https?:(?:[^()\s]|\([^()\s]*\))+)\)/g)].map((m) => m[1]);
  if (srcIdx >= 0 && sources.length < 5) errors.push(`${tag}: ${sources.length} sources (minimum 5)`);
  const academic = /doi\.org|pubmed|ncbi\.nlm\.nih\.gov|nature\.com|sciencedirect|springer|wiley|tandfonline|jamanetwork|thelancet|nejm|frontiersin|plos|bmj|sagepub|cambridge\.org|oup\.com|apa\.org|clinicaltrials\.gov/;
  if (srcIdx >= 0 && !sources.some((u) => academic.test(u))) errors.push(`${tag}: no academic source (journal, DOI or PubMed)`);

  if (d.image && !existsSync(join(root, 'src/assets/photos', `${d.image}.jpg`))) errors.push(`${tag}: photo src/assets/photos/${d.image}.jpg is missing`);

  // Internal links: ../page from /blog/x → /page ; from /es/blog/x → /es/page
  for (const m of post.body.matchAll(/\]\((\.\.\/[^)#\s]*|\/[^)#\s]*)(#[^)]*)?\)/g)) {
    let path = m[1];
    if (path.startsWith('../')) path = (lang === 'es' ? '/es/' : '/') + path.slice(3);
    path = path.replace(/\/$/, '') || '/';
    if (!internalExists(path)) errors.push(`${tag}: internal link ${m[1]} → ${path} has no page`);
  }
  return { ...post, slug, lang, links: [...post.body.matchAll(/\]\((https?:(?:[^()\s]|\([^()\s]*\))+)\)/g)].map((m) => m[1]) };
}

function internalExists(path) {
  if (path === '/' || path === '/es') return true;
  const blog = path.match(/^(\/es)?\/blog\/([^/]+)$/);
  if (blog) return existsSync(join(root, 'src/content/blog', blog[1] ? 'es' : 'en', `${blog[2]}.md`));
  const base = join(root, 'src/pages', path);
  return existsSync(`${base}.astro`) || existsSync(join(base, 'index.astro')) || existsSync(`${base}.md`);
}

async function fetchOk(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' }, signal: AbortSignal.timeout(20000) });
      if (res.status < 400) return { ok: true, status: res.status };
      if (method === 'GET') return { ok: false, status: res.status };
    } catch (e) { if (method === 'GET') return { ok: false, status: e.name === 'TimeoutError' ? 'timeout' : e.message }; }
  }
}

async function verify(url) {
  const doi = url.match(/doi\.org\/(10\.[^\s?#]+)/i)?.[1];
  if (doi) {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { headers: { 'User-Agent': 'MexiSolWorld-blog/1.0 (mailto:info@mexisol.world)' } });
    if (!res.ok) return errors.push(`DOI not found in Crossref: ${url}`);
    const w = (await res.json()).message;
    return notes.push(`DOI ${doi}: "${w.title?.[0]}" (${w['container-title']?.[0] ?? ''}, ${w.issued?.['date-parts']?.[0]?.[0] ?? '?'})`);
  }
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
    if (!res.ok) return errors.push(`YouTube video not available: ${url}`);
    const v = await res.json();
    return notes.push(`YouTube: "${v.title}" by ${v.author_name}`);
  }
  const pmid = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/)?.[1];
  if (pmid) {
    const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmid}`);
    const r = res.ok ? (await res.json()).result?.[pmid] : null;
    if (!r || r.error) return errors.push(`PubMed ID not found: ${url}`);
    return notes.push(`PubMed ${pmid}: "${r.title}" (${r.source}, ${r.pubdate})`);
  }
  const r = await fetchOk(url);
  // Some publishers block scripts with 403/429 even when the page is fine. Those need a DOI or PubMed link instead.
  if (!r.ok) (r.status === 403 || r.status === 429 ? warnings : errors).push(`Link returned ${r.status}: ${url}${r.status === 403 || r.status === 429 ? ' (blocked for scripts; use a DOI/PubMed link or confirm the page with WebFetch)' : ''}`);
}

const slug = process.argv[2];
if (!slug) { console.log('Usage: node scripts/blog/check-post.mjs <english-slug>'); process.exit(2); }
const en = checkLang('en', slug);
const esSlug = en?.data.translation;
const es = esSlug ? checkLang('es', esSlug) : null;
if (en && es && es.data.translation !== slug) errors.push(`es/${esSlug}: translation should be "${slug}"`);
if (en && es && en.data.image !== es.data.image) warnings.push('English and Spanish posts use different photos');

const urls = [...new Set([...(en?.links ?? []), ...(es?.links ?? [])])].filter((u) => !u.startsWith('https://mexisol.world'));
for (let i = 0; i < urls.length; i += 6) await Promise.all(urls.slice(i, i + 6).map(verify));

for (const n of notes) console.log(`  source  ${n}`);
for (const w of warnings) console.log(`  warn    ${w}`);
for (const e of errors) console.log(`  ERROR   ${e}`);
console.log(errors.length ? `\n${errors.length} error(s). Fix them and run again.` : `\nOK: ${urls.length} external links checked, ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
