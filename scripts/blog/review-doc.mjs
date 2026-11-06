// Builds the records the blog review dashboard shows (https://claude.ai/artifact/B9vLVuudKtm8yguA1B1Au3).
//
//   node scripts/blog/review-doc.mjs post <english-slug> [--ref origin/blog/<slug>]
//     Reads the EN and ES post from a git ref (default: the post's PR branch) and writes
//     blog/.review/<slug>.json (fields for posts/<slug>) and blog/.review/<slug>.jpg (the cover, for upload).
//   node scripts/blog/review-doc.mjs plan YYYY-MM
//     Writes blog/.review/plan-YYYY-MM/<slug>.json for every planned post: the plan fields only, no status,
//     so it can be merged into existing records without touching their review state.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const out = join(root, 'blog/.review');
const git = (...a) => execFileSync('git', a, { cwd: root, maxBuffer: 64 * 1024 * 1024 });

function parse(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
  }
  return { data, body: m[2].trim() };
}
const words = (s) => s.replace(/[#*_>`|[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
function countSources(body) {
  const i = body.search(/^## (Sources|Fuentes)\s*$/m);
  const urls = i < 0 ? [] : [...body.slice(i).matchAll(/\]\((https?:(?:[^()\s]|\([^()\s]*\))+)\)/g)].map((m) => m[1]);
  const academic = /doi\.org|pubmed|ncbi\.nlm\.nih\.gov|nature\.com|sciencedirect|springer|wiley|tandfonline|jamanetwork|thelancet|nejm|frontiersin|plos|bmj|sagepub|cambridge\.org|oup\.com|apa\.org|clinicaltrials\.gov|who\.int|nih\.gov|gob\.mx/;
  const video = /youtube\.com|youtu\.be|vimeo\.com|ted\.com/;
  const c = { academic: 0, media: 0, video: 0, total: urls.length };
  for (const u of urls) c[academic.test(u) ? 'academic' : video.test(u) ? 'video' : 'media']++;
  return c;
}

const [cmd, arg, ...rest] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

if (cmd === 'post') {
  const slug = arg;
  try { git('fetch', '-q', 'origin'); } catch {}
  const ref = rest[rest.indexOf('--ref') + 1] && rest.includes('--ref') ? rest[rest.indexOf('--ref') + 1] : `origin/blog/${slug}`;
  const en = parse(git('show', `${ref}:src/content/blog/en/${slug}.md`).toString());
  const slugEs = en.data.translation;
  const es = parse(git('show', `${ref}:src/content/blog/es/${slugEs}.md`).toString());
  writeFileSync(join(out, `${slug}.jpg`), git('show', `${ref}:src/assets/photos/${en.data.image}.jpg`));
  const doc = {
    slug, slugEs, date: en.data.date,
    title: en.data.title, titleEs: es.data.title,
    description: en.data.description, descriptionEs: es.data.description,
    keyword: en.data.keyword, keywordEs: es.data.keyword, profile: en.data.profile,
    imageAlt: en.data.imageAlt, imageCredit: en.data.imageCredit, imageCreditUrl: en.data.imageCreditUrl,
    bodyEn: en.body, bodyEs: es.body,
    words: { en: words(en.body), es: words(es.body) },
    sources: countSources(en.body),
    liveUrl: `https://mexisol.world/blog/${slug}`, liveUrlEs: `https://mexisol.world/es/blog/${slugEs}`,
    commit: git('rev-parse', '--short', ref).toString().trim(),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(join(out, `${slug}.json`), JSON.stringify(doc, null, 2));
  console.log(`${join(out, `${slug}.json`)}\n${join(out, `${slug}.jpg`)}`);
} else if (cmd === 'plan') {
  const plan = JSON.parse(readFileSync(join(root, 'blog/plans', `${arg}.json`), 'utf8'));
  const dir = join(out, `plan-${arg}`);
  mkdirSync(dir, { recursive: true });
  for (const p of plan.posts) {
    const doc = { slug: p.slug, slugEs: p.slugEs, date: p.date, title: p.title, titleEs: p.titleEs, keyword: p.keyword,
      keywordEs: p.keywordEs, profile: p.profile, angle: p.angle, outline: p.outline };
    writeFileSync(join(dir, `${p.slug}.json`), JSON.stringify(doc, null, 2));
  }
  console.log(`${plan.posts.length} records in ${dir}`);
} else {
  console.log('Usage: review-doc.mjs post <slug> [--ref <git ref>] | plan YYYY-MM');
}
