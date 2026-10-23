// Fails if any internal link, asset or #anchor in dist/ points nowhere.
// Resolves URLs the way GitHub Pages does: /about -> about.html.
// Usage: node scripts/check-links.mjs [distDir] [basePath]
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const dist = process.argv[2] || 'dist';
const base = (process.argv[3] ?? process.env.BASE_PATH ?? '/').replace(/\/$/, '');

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const exists = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

async function resolve(urlPath) {
  let p = decodeURIComponent(urlPath);
  if (base && p.startsWith(base)) p = p.slice(base.length) || '/';
  else if (base) return null; // outside the site
  const rel = p.replace(/^\//, '');
  const candidates = p.endsWith('/') ? [path.join(dist, rel, 'index.html')] : [path.join(dist, rel), path.join(dist, `${rel}.html`), path.join(dist, rel, 'index.html')];
  for (const c of candidates) if (await exists(c)) return c;
  return null;
}

const pages = await walk(dist);
const ids = new Map();
const idsOf = async (file) => {
  if (!ids.has(file)) {
    const html = await readFile(file, 'utf8');
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(file);
};

const problems = [];
let checked = 0;
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g), ...html.matchAll(/\ssrcset="([^"]+)"/g)]
    .flatMap((m) => (m[0].includes('srcset') ? m[1].split(',').map((s) => s.trim().split(/\s+/)[0]) : [m[1]]));
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(ref) || ref.startsWith('//')) {
      if (/^http:\/\//.test(ref)) problems.push(`${page}: insecure http link ${ref}`);
      continue;
    }
    checked++;
    // Relative links (used in blog posts) resolve against the page's own URL.
    const pageUrl = `${base}/${path.relative(dist, page).replace(/\\/g, '/').replace(/(index)?\.html$/, '')}`;
    const abs = ref.startsWith('/') || ref.startsWith('#') ? ref : (({ pathname, search, hash: h }) => pathname + search + h)(new URL(ref, `http://site${pageUrl}`));
    const [p, hash] = abs.split('#');
    const target = p ? await resolve(p.split('?')[0]) : page;
    if (!target) { problems.push(`${page}: broken link ${ref}`); continue; }
    if (hash && target.endsWith('.html') && !(await idsOf(target)).has(hash)) problems.push(`${page}: missing anchor ${ref}`);
  }
  if (/\[[A-Z][A-Z _]{2,}\]/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) problems.push(`${page}: contains a [PLACEHOLDER]`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) in ${pages.length} pages.`);
  process.exit(1);
}
console.log(`Links OK: ${checked} internal links and assets across ${pages.length} pages.`);
