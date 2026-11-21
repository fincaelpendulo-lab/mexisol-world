// Blog cover with a headline on the photo. The same image is the post's cover on the site and the image of its
// Facebook post (scripts/blog/facebook-post.mjs takes it from the live page).
//
//   node scripts/blog/cover.mjs <slug> --photo <base.jpg> --title "There is no bad trip" [--sub "What a hard night can teach"] [--focus left|center|right]
//
// - Writes src/assets/photos/blog-<slug>.jpg (1600x900).
// - Keeps the clean photo as blog/covers/<slug>.jpg so the cover can be rebuilt with another title.
// - Brand look (marketing/rules.md): green-tinted photo, white logo lockup, big white Cal Sans headline, light
//   Tenor Sans subtitle. All text white; no ochre or orange text. Title 2 to 6 words, subtitle one short line:
//   both must read at phone size in a Facebook feed and on the blog cards.
// - Text sits on the left, inside the area that survives the 3:2 crop on the blog cards.
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
import sharp from 'sharp';
// sharp's own text rendering ignores custom fonts on macOS, so the text is drawn as SVG paths from the brand TTFs
// (from Google Fonts) with fontkitten, which Astro already installs.
import { create as loadFont } from 'fontkitten';
import { readFileSync } from 'node:fs';
const args = process.argv.slice(2);
const slug = args[0];
const opt = (k, d) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const title = opt('title');
const sub = opt('sub', '');
const focus = opt('focus', 'right');
if (!slug || !title) { console.log('Usage: cover.mjs <slug> --photo <file> --title "Short hook" [--sub "One short line"] [--focus left|center|right]'); process.exit(2); }

const base = join(root, 'blog/covers', `${slug}.jpg`);
const photoArg = opt('photo');
mkdirSync(dirname(base), { recursive: true });
if (photoArg && resolve(photoArg) !== base) copyFileSync(photoArg, base);
if (!existsSync(base)) { console.error(`No photo: pass --photo or put one at ${base}`); process.exit(1); }

const W = 1600, H = 900;
const FOREST = '#314a34';
const display = join(root, 'blog/covers/fonts/CalSans-Regular.ttf');
const textFont = join(root, 'blog/covers/fonts/TenorSans-Regular.ttf');
function textSvg(str, fontPath, size, maxW, lineH) {
  const font = loadFont(readFileSync(fontPath));
  const k = size / font.unitsPerEm;
  const width = (t) => font.glyphsForString(t).reduce((w, g) => w + g.advanceWidth, 0) * k;
  const lines = [];
  for (const word of str.split(/\s+/)) {
    const tryLine = lines.length ? `${lines.at(-1)} ${word}` : word;
    if (lines.length && width(tryLine) <= maxW) lines[lines.length - 1] = tryLine; else lines.push(word);
  }
  const asc = font.ascent * k;
  let paths = '', w = 0;
  lines.forEach((line, i) => {
    let x = 0;
    for (const g of font.glyphsForString(line)) {
      paths += `<path transform="translate(${x.toFixed(1)} ${(asc + i * lineH).toFixed(1)}) scale(${k} ${-k})" d="${g.path.toSVG()}"/>`;
      x += g.advanceWidth * k;
    }
    w = Math.max(w, x);
  });
  const h = Math.ceil(asc + (lines.length - 1) * lineH + size * 0.25);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(w) + 4}" height="${h}"><g fill="#fff">${paths}</g></svg>`;
  return { data: Buffer.from(svg), info: { width: Math.ceil(w) + 4, height: h }, lines: lines.length };
}

// Photo, pushed to the side named by --focus so the subject stays clear of the text.
const position = { left: 'west', center: 'centre', right: 'east' }[focus] ?? 'east';
const photo = await sharp(base).rotate().resize(W, H, { fit: 'cover', position }).modulate({ saturation: 0.72, brightness: 0.92 }).toBuffer();

// Forest-green shade from the left, plus a soft bottom shade for the logo.
const shade = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="l" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${FOREST}" stop-opacity="0.82"/>
      <stop offset="0.42" stop-color="${FOREST}" stop-opacity="0.6"/>
      <stop offset="0.72" stop-color="${FOREST}" stop-opacity="0.1"/>
      <stop offset="1" stop-color="${FOREST}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="b" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0.7" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${FOREST}" fill-opacity="0.32"/>
  <rect width="100%" height="100%" fill="url(#l)"/>
  <rect width="100%" height="100%" fill="url(#b)"/>
</svg>`);

// Headline: as large as fits in the text column (3 lines at most).
const left = 150, colW = 860;
let size = 150, head;
for (; size >= 84; size -= 6) {
  head = textSvg(title.replace(/\*/g, ''), display, size, colW, size * 0.98);
  if (head.lines <= 3) break;
}

const layers = [{ input: shade }];
let subImg = null;
if (sub) subImg = textSvg(sub, textFont, 48, colW, 58);
const gap = 30;
const blockH = head.info.height + (subImg ? gap + subImg.info.height : 0);
const y = Math.round((H - blockH) / 2) + 40;
layers.push({ input: head.data, left, top: y });
if (subImg) layers.push({ input: subImg.data, left: left + 4, top: y + head.info.height + gap });

const logo = await sharp(join(root, 'src/assets/brand/lockup-white.png')).resize({ height: 92 }).toBuffer();
layers.push({ input: logo, left, top: 70 });

const out = join(root, 'src/assets/photos', `blog-${slug}.jpg`);
await sharp(photo).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toFile(out);
console.log(`${out} (headline ${size}px, ${head.lines} lines)`);
